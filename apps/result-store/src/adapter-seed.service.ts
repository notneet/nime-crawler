import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Adapter } from '@libs/commons/entities';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';

@Injectable()
export class AdapterSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdapterSeedService.name);

  constructor(@InjectRepository(Adapter) private readonly repo: Repository<Adapter>) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.repo.count()) > 0) return;
    // `stages` is a `simple-json` column; TypeORM's QueryDeepPartialEntity
    // recursively wraps the JSON shape, so bridge the concrete entity object
    // to the insert payload type.
    const row: Pick<Adapter, 'source' | 'baseUrl' | 'enabled' | 'stages'> = {
      source: otakudesuAdapter.source,
      baseUrl: otakudesuAdapter.baseUrl,
      enabled: otakudesuAdapter.enabled,
      stages: otakudesuAdapter.stages,
    };
    await this.repo.insert(row as QueryDeepPartialEntity<Adapter>);
    this.logger.log(`seeded adapter: ${otakudesuAdapter.source}`);
  }
}
