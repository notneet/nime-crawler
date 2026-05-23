import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, routingKey } from '@libs/commons/messaging/exchanges';
import { CrawlJobDto } from '@libs/commons/messaging/crawl-job.dto';
import { AdapterService } from '@libs/commons/adapters/adapter.service';

@Injectable()
export class RecrawlService {
  constructor(
    private readonly amqp: AmqpConnection,
    private readonly adapters: AdapterService,
  ) {}

  async anime(source: string, url: string): Promise<void> {
    const adapter = await this.adapters.getOrThrow(source);
    const job: CrawlJobDto = { source, stage: 'detail', url, force: true, adapter };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'detail', source), job);
  }

  async episode(source: string, url: string): Promise<void> {
    const adapter = await this.adapters.getOrThrow(source);
    const job: CrawlJobDto = { source, stage: 'episode', url, force: true, adapter };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'episode', source), job);
  }
}
