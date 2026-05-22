import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { AmqpConnection, Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  buildNextJobs,
  buildParsedResult,
  CrawlJobDto,
  EngineService,
  EXCHANGES,
  routingKey,
  SiteRegistry,
  TimingInterceptor,
} from '@libs/commons';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly engine: EngineService,
    private readonly registry: SiteRegistry,
  ) {}

  @UseInterceptors(TimingInterceptor)
  @RabbitSubscribe({
    exchange: EXCHANGES.crawl,
    routingKey: 'crawl.#',
    queue: 'anime.crawl.worker',
    queueOptions: {
      durable: true,
      deadLetterExchange: EXCHANGES.dlx,
    },
  })
  async onCrawl(job: CrawlJobDto): Promise<void | Nack> {
    return this.handle(job);
  }

  async handle(job: CrawlJobDto): Promise<void | Nack> {
    const adapter = this.registry.get(job.source);
    const stageConfig = adapter?.stages[job.stage];
    if (!adapter || !stageConfig) {
      this.logger.error(`no config for ${job.source}/${job.stage}; dead-lettering`);
      return new Nack(false);
    }

    this.logger.log(`[${job.source}/${job.stage}] parsing ${job.url}`);
    try {
      const parsed = await this.engine.parse(stageConfig, job.url);

      const nextJobs = buildNextJobs(adapter, job.stage, parsed);
      for (const next of nextJobs) {
        await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', next.stage, next.source), next);
      }

      const result = buildParsedResult(job.source, job.stage, job.url, parsed);
      await this.amqp.publish(EXCHANGES.parsed, routingKey('parsed', job.stage, job.source), result);
      this.logger.log(
        `[${job.source}/${job.stage}] done ${job.url} — ${Object.keys(parsed).length} fields, ${nextJobs.length} next jobs published`,
      );
    } catch (err) {
      this.logger.error(`parse failed for ${job.url}: ${(err as Error).message}`);
      return new Nack(false);
    }
  }
}
