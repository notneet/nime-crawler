import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpConnection, Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import type { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { TimingInterceptor } from '@libs/commons/interceptors/timing/timing.interceptor';
import { ArchiveService } from './archive.service';

interface XDeath {
  count: number;
  reason: string;
  queue: string;
}
interface AmqpMessage {
  properties: { headers?: Record<string, unknown> };
}

@Injectable()
export class ArchiveConsumer {
  private readonly logger = new Logger(ArchiveConsumer.name);
  private readonly maxRetries: number;

  constructor(
    private readonly svc: ArchiveService,
    private readonly amqp: AmqpConnection,
    cfg: ConfigService,
  ) {
    this.maxRetries = Number(cfg.get<string>('DOWNLOAD_MAX_RETRIES', '3'));
  }

  @UseInterceptors(TimingInterceptor)
  @RabbitSubscribe({
    exchange: EXCHANGES.download,
    routingKey: 'download.episode.*',
    queue: 'anime.download.archive',
    queueOptions: { durable: true, deadLetterExchange: EXCHANGES.dlx },
  })
  async onJob(job: DownloadJobDto, amqpMsg: AmqpMessage): Promise<void | Nack> {
    try {
      await this.svc.handle(job);
    } catch (err) {
      const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
      const retries = this.retryCount(amqpMsg);
      if (retries >= this.maxRetries) {
        this.logger.error(
          `giving up on episode ${job.episodeId} after ${retries} retr(ies); parking to ${EXCHANGES.dlx}/download.failed. ${message}`,
        );
        // ACK (return void) so the message leaves the retry cycle, but first park
        // a copy in the durable failed queue so the job is never silently dropped.
        await this.amqp.publish(EXCHANGES.dlx, 'download.failed', job);
        return;
      }
      this.logger.warn(
        `episode ${job.episodeId} failed (attempt ${retries + 1}/${this.maxRetries + 1}); dead-lettering for delayed retry. ${message}`,
      );
      // Nack(requeue=false) -> dlx -> retry queue (TTL) -> back to main exchange.
      return new Nack(false);
    }
  }

  private retryCount(msg: AmqpMessage): number {
    const deaths = msg.properties.headers?.['x-death'];
    if (!Array.isArray(deaths)) return 0;
    const rejected = (deaths as XDeath[]).find((d) => d.reason === 'rejected');
    return rejected?.count ?? 0;
  }
}
