import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Adapter } from '@libs/commons/entities';
import { validateStages } from './stages-validation';
import { AdapterFormDto } from './adapter-form.dto';

export type SaveResult = { ok: true; source: string } | { ok: false; error: string };

@Injectable()
export class AdapterAdminService {
  constructor(@InjectRepository(Adapter) private readonly repo: Repository<Adapter>) {}

  list(): Promise<Adapter[]> {
    return this.repo.find({ order: { source: 'ASC' } });
  }

  get(source: string): Promise<Adapter | null> {
    return this.repo.findOneBy({ source });
  }

  async create(form: AdapterFormDto): Promise<SaveResult> {
    const stages = validateStages(form.stages);
    if (!stages.ok) return { ok: false, error: stages.error };
    if (await this.repo.findOneBy({ source: form.source })) {
      return { ok: false, error: `adapter "${form.source}" already exists` };
    }
    const row: Pick<Adapter, 'source' | 'baseUrl' | 'enabled' | 'stages'> = {
      source: form.source,
      baseUrl: form.baseUrl,
      enabled: form.enabled === 'on',
      stages: stages.stages,
    };
    await this.repo.insert(row as QueryDeepPartialEntity<Adapter>);
    return { ok: true, source: form.source };
  }

  async update(source: string, form: AdapterFormDto): Promise<SaveResult> {
    const stages = validateStages(form.stages);
    if (!stages.ok) return { ok: false, error: stages.error };
    const existing = await this.repo.findOneBy({ source });
    if (!existing) return { ok: false, error: `adapter "${source}" not found` };
    const patch: Pick<Adapter, 'baseUrl' | 'enabled' | 'stages'> = {
      baseUrl: form.baseUrl,
      enabled: form.enabled === 'on',
      stages: stages.stages,
    };
    await this.repo.update({ source }, patch as QueryDeepPartialEntity<Adapter>);
    return { ok: true, source };
  }

  async toggle(source: string): Promise<void> {
    const row = await this.repo.findOneBy({ source });
    if (row) await this.repo.update({ source }, { enabled: !row.enabled });
  }

  async remove(source: string): Promise<void> {
    await this.repo.delete({ source });
  }
}
