import { AdapterSeedService } from './adapter-seed.service';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';
import type { Repository } from 'typeorm';
import type { Adapter } from '@libs/commons/entities';

describe('AdapterSeedService', () => {
  it('inserts otakudesu when the table is empty', async () => {
    const repo = {
      count: jest.fn().mockResolvedValue(0),
      insert: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<Adapter>;
    await new AdapterSeedService(repo).onApplicationBootstrap();
    expect(repo.insert).toHaveBeenCalledWith({
      source: otakudesuAdapter.source,
      baseUrl: otakudesuAdapter.baseUrl,
      enabled: otakudesuAdapter.enabled,
      stages: otakudesuAdapter.stages,
    });
    expect(repo.count).toHaveBeenCalledTimes(1);
  });

  it('does nothing when at least one adapter row exists', async () => {
    const repo = {
      count: jest.fn().mockResolvedValue(1),
      insert: jest.fn(),
    } as unknown as Repository<Adapter>;
    await new AdapterSeedService(repo).onApplicationBootstrap();
    expect(repo.insert).not.toHaveBeenCalled();
    expect(repo.count).toHaveBeenCalledTimes(1);
  });
});
