import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, routingKey, SiteRegistry, CrawlJobDto } from '@libs/commons';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly registry: SiteRegistry,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async seedAll(): Promise<void> {
    for (const source of this.registry.enabledSources()) {
      await this.seedSite(source);
    }
  }

  async seedSite(source: string): Promise<void> {
    const adapter = this.registry.getOrThrow(source);
    const job: CrawlJobDto = {
      source: adapter.source,
      stage: 'index',
      url: `${adapter.baseUrl}/`,
    };
    this.logger.log(`seeding ${source} index: ${job.url}`);
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'index', source), job);
  }
}
