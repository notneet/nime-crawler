import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, ParsedResultDto, TimingInterceptor } from '@libs/commons';
import { CrawlResult } from './crawl-result.entity';

@Injectable()
export class ResultStoreService {
  private readonly logger = new Logger(ResultStoreService.name);

  constructor(
    @InjectRepository(CrawlResult)
    private readonly repo: Repository<CrawlResult>,
  ) {}

  @UseInterceptors(TimingInterceptor)
  @RabbitSubscribe({
    exchange: EXCHANGES.results,
    routingKey: 'result.#',
    queue: 'anime.results.store',
    queueOptions: { durable: true, deadLetterExchange: EXCHANGES.dlx },
  })
  async onResult(result: ParsedResultDto): Promise<void | Nack> {
    return this.handle(result);
  }

  async handle(result: ParsedResultDto): Promise<void | Nack> {
    try {
      await this.repo.upsert(
        {
          source: result.source,
          stage: result.stage,
          url: result.url,
          data: result.data,
        },
        ['source', 'url', 'stage'],
      );
      this.logger.log(`[${result.source}/${result.stage}] stored: ${result.url}`);
    } catch (err) {
      this.logger.error(
        `store failed for ${result.source}/${result.stage}: ${(err as Error).message}`,
      );
      return new Nack(false);
    }
  }
}
