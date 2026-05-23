import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AdapterService } from '@libs/commons/adapters/adapter.service';
import { EXCHANGES, routingKey } from '@libs/commons/messaging/exchanges';
import type { CrawlJobDto } from '@libs/commons/messaging/crawl-job.dto';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly adapters: AdapterService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAll();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async seedAll(): Promise<void> {
    const adapters = await this.adapters.enabledAdapters();
    this.logger.log(
      `seeding ${adapters.length} enabled site(s): ${adapters.map((a) => a.source).join(', ')}`,
    );
    for (const adapter of adapters) {
      const job: CrawlJobDto = {
        source: adapter.source,
        stage: 'index',
        url: `${adapter.baseUrl}/`,
        adapter,
      };
      await this.amqp.publish(
        EXCHANGES.crawl,
        routingKey('crawl', 'index', adapter.source),
        job,
      );
      this.logger.log(`seeded ${adapter.source} index: ${job.url}`);
    }
  }
}
