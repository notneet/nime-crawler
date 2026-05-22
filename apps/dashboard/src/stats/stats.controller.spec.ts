import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('StatsController', () => {
  const stats = { summary: jest.fn() };
  const controller = new StatsController(stats as unknown as StatsService);

  it('index returns the summary view-model', async () => {
    const summary = { counts: {}, gaps: {}, newestAnimeUpdatedAt: null };
    stats.summary.mockResolvedValue(summary);
    expect(await controller.index()).toBe(summary);
  });
});
