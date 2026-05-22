import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, routingKey, SiteRegistry, CrawlJobDto } from '@libs/commons';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly registry: SiteRegistry,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAll();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async seedAll(): Promise<void> {
    const sources = this.registry.enabledSources();
    this.logger.log(`seeding ${sources.length} enabled site(s): ${sources.join(', ')}`);
    for (const source of sources) {
      await this.seedSite(source);
    }
  }

  async seedSite(source: string): Promise<void> {
    const start = Date.now();
    const adapter = this.registry.getOrThrow(source);
    const job: CrawlJobDto = {
      source: adapter.source,
      stage: 'index',
      url: `${adapter.baseUrl}/`,
    };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'index', source), job);
    this.logger.log(`seeded ${source} index: ${job.url} (${Date.now() - start}ms)`);
  }
}
