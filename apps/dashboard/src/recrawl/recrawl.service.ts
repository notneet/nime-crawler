import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, routingKey } from '@libs/commons/messaging/exchanges';
import { CrawlJobDto } from '@libs/commons/messaging/crawl-job.dto';

@Injectable()
export class RecrawlService {
  constructor(private readonly amqp: AmqpConnection) {}

  async anime(source: string, url: string): Promise<void> {
    const job: CrawlJobDto = { source, stage: 'detail', url };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'detail', source), job);
  }

  async episode(source: string, url: string): Promise<void> {
    const job: CrawlJobDto = { source, stage: 'episode', url };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'episode', source), job);
  }
}
