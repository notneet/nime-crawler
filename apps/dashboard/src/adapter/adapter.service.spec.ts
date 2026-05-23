import { Repository } from 'typeorm';
import { AdapterAdminService } from './adapter.service';
import { Adapter } from '@libs/commons/entities';
import { AdapterFormDto } from './adapter-form.dto';

describe('AdapterAdminService', () => {
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new AdapterAdminService(repo as unknown as Repository<Adapter>);

  const validStages = '{"index":{"engine":"xpath","patterns":[]}}';
  const form = (over: Partial<AdapterFormDto> = {}): AdapterFormDto => ({
    source: 'otakudesu',
    baseUrl: 'https://otakudesu.blog',
    enabled: 'on',
    stages: validStages,
    ...over,
  });

  beforeEach(() => jest.clearAllMocks());

  it('create rejects invalid JSON', async () => {
    const res = await service.create(form({ stages: '{bad' }));
    expect(res.ok).toBe(false);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('create rejects a duplicate source', async () => {
    repo.findOneBy.mockResolvedValue({ source: 'otakudesu' });
    const res = await service.create(form());
    expect(res.ok).toBe(false);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('create inserts on the happy path', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const res = await service.create(form());
    expect(res).toEqual({ ok: true, source: 'otakudesu' });
    expect(repo.insert).toHaveBeenCalledTimes(1);
  });

  it('update rejects a missing source', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const res = await service.update('otakudesu', form());
    expect(res.ok).toBe(false);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('toggle flips enabled', async () => {
    repo.findOneBy.mockResolvedValue({ enabled: true });
    await service.toggle('otakudesu');
    expect(repo.update).toHaveBeenCalledWith({ source: 'otakudesu' }, { enabled: false });
  });
});
