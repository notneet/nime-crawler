import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection, Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  buildNextJobs,
  buildParsedResult,
  CrawlJobDto,
  EngineService,
  EXCHANGES,
  routingKey,
  ThrottleInterceptor,
  TimingInterceptor,
} from '@libs/commons';
import { Anime, Episode } from '@libs/commons/entities';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);
  private readonly freshMs: number;

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly engine: EngineService,
    private readonly config: ConfigService,
    @InjectRepository(Anime) private readonly animeRepo: Repository<Anime>,
    @InjectRepository(Episode) private readonly episodeRepo: Repository<Episode>,
  ) {
    this.freshMs = Number(this.config.get<string>('SKIP_FRESH_HOURS', '72')) * 3_600_000;
  }

  // A leaf record (detail/episode) is fresh when it already exists and was updated
  // within SKIP_FRESH_HOURS. Fail open: any lookup error → not fresh → fetch as usual.
  private async isFresh(job: CrawlJobDto): Promise<boolean> {
    if (!(this.freshMs > 0)) return false;
    if (job.stage !== 'detail' && job.stage !== 'episode') return false;
    try {
      const repo: Repository<Anime | Episode> =
        job.stage === 'detail' ? this.animeRepo : this.episodeRepo;
      const row = await repo.findOne({
        where: { source: job.source, url: job.url },
        select: { updatedAt: true },
      });
      if (!row?.updatedAt) return false;
      return Date.now() - new Date(row.updatedAt).getTime() < this.freshMs;
    } catch (err) {
      this.logger.warn(`skip-check failed for ${job.url}: ${(err as Error).message}`);
      return false;
    }
  }

  @UseInterceptors(ThrottleInterceptor, TimingInterceptor)
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
    const adapter = job.adapter;
    const stageConfig = adapter?.stages[job.stage];
    if (!adapter || !stageConfig) {
      this.logger.error(`no config for ${job.source}/${job.stage}; dead-lettering`);
      return new Nack(false);
    }

    if (!job.force && (await this.isFresh(job))) {
      this.logger.log(`[${job.source}/${job.stage}] skip (fresh): ${job.url}`);
      return;
    }

    this.logger.log(`[${job.source}/${job.stage}] parsing ${job.url}`);
    try {
      const parsed = await this.engine.parse(stageConfig, job.url);

      const nextJobs = job.noDiscover ? [] : buildNextJobs(adapter, job.stage, parsed);
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
