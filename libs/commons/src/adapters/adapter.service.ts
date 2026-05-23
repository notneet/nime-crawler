import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Adapter } from '../entities/adapter.entity';
import type { SiteAdapter } from './site-adapter.types';

const toSiteAdapter = (a: Adapter): SiteAdapter => ({
  source: a.source,
  baseUrl: a.baseUrl,
  enabled: a.enabled,
  stages: a.stages,
});

@Injectable()
export class AdapterService {
  constructor(@InjectRepository(Adapter) private readonly repo: Repository<Adapter>) {}

  async get(source: string): Promise<SiteAdapter | undefined> {
    const row = await this.repo.findOneBy({ source });
    return row ? toSiteAdapter(row) : undefined;
  }

  async getOrThrow(source: string): Promise<SiteAdapter> {
    const a = await this.get(source);
    if (!a) throw new Error(`unknown site: ${source}`);
    return a;
  }

  async enabledAdapters(): Promise<SiteAdapter[]> {
    const rows = await this.repo.findBy({ enabled: true });
    return rows.map(toSiteAdapter);
  }
}
