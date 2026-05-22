import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { DataSource, QueryDeepPartialEntity } from 'typeorm';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { ParsedResultDto } from '@libs/commons/messaging/parsed-result.dto';
import { TimingInterceptor } from '@libs/commons/interceptors/timing/timing.interceptor';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { ResultMapper } from './result.mapper';

@Injectable()
export class ResultStoreService {
  private readonly logger = new Logger(ResultStoreService.name);
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly dataSource: DataSource,
    private readonly mapper: ResultMapper,
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
    const run = this.writeChain.then(() => this.persist(result));
    this.writeChain = run.catch(() => undefined);
    return run;
  }

  private async persist(result: ParsedResultDto): Promise<void | Nack> {
    try {
      const m = this.mapper.map(result);

      await this.dataSource.transaction(async (manager) => {
        let anime: Anime | null = null;

        if (m.anime) {
          await manager.upsert(Anime, m.anime as unknown as QueryDeepPartialEntity<Anime>, ['source', 'url']);
          anime = await manager.findOneBy(Anime, { source: m.anime.source, url: m.anime.url });
        }

        if (m.genres?.length && anime) {
          for (const name of m.genres) {
            const trimmed = name.trim();
            if (!trimmed) continue;
            const genreSlug = trimmed.toLowerCase().replace(/\s+/g, '-');
            await manager.upsert(Genre, { name: trimmed, slug: genreSlug }, ['slug']);
            const g = await manager.findOneBy(Genre, { slug: genreSlug });
            if (g) {
              await manager.upsert(AnimeGenre, { animeId: anime.id, genreId: g.id }, ['animeId', 'genreId']);
            }
          }
        }

        if (m.episode) {
          await manager.upsert(Episode, m.episode as unknown as QueryDeepPartialEntity<Episode>, ['source', 'url']);
        }

        if (m.mirrors?.length) {
          await manager.upsert(Mirror, m.mirrors, ['episodeUrl', 'quality', 'host']);
        }

        if (m.downloads?.length) {
          await manager.upsert(DownloadLink, m.downloads, ['url', 'ownerUrl', 'kind']);
        }
      });

      this.logger.log(`[${result.source}/${result.stage}] stored: ${result.url}`);
    } catch (err) {
      this.logger.error(
        `store failed for ${result.source}/${result.stage}: ${(err as Error).message}`,
      );
      return new Nack(false);
    }
  }
}
