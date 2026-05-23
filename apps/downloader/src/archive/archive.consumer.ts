import { Injectable, UseInterceptors } from '@nestjs/common';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import type { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { TimingInterceptor } from '@libs/commons/interceptors/timing/timing.interceptor';
import { ArchiveService } from './archive.service';

@Injectable()
export class ArchiveConsumer {
  constructor(private readonly svc: ArchiveService) {}

  @UseInterceptors(TimingInterceptor)
  @RabbitSubscribe({
    exchange: EXCHANGES.download,
    routingKey: 'download.episode.*',
    queue: 'anime.download.archive',
    queueOptions: { durable: true, deadLetterExchange: EXCHANGES.dlx },
  })
  async onJob(job: DownloadJobDto): Promise<void | Nack> {
    try {
      await this.svc.handle(job);
    } catch {
      return new Nack(false);
    }
  }
}
