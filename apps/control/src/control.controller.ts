import { Controller, Logger, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  AdapterService,
  CrawlJobDto,
  CrawlTriggerDto,
  EXCHANGES,
  routingKey,
  TimingInterceptor,
} from '@libs/commons';

@Controller()
export class ControlController {
  private readonly logger = new Logger(ControlController.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly adapters: AdapterService,
  ) {}

  @EventPattern('crawl.trigger')
  @UseInterceptors(TimingInterceptor)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async onTrigger(@Payload() trigger: CrawlTriggerDto): Promise<void> {
    this.logger.log(`trigger received for ${trigger.source}`);
    const adapter = await this.adapters.getOrThrow(trigger.source);
    const job: CrawlJobDto = {
      source: adapter.source,
      stage: 'index',
      url: `${adapter.baseUrl}/`,
      adapter,
    };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', 'index', adapter.source), job);
    this.logger.log(`[${adapter.source}/index] seeded ${job.url}`);
  }
}
