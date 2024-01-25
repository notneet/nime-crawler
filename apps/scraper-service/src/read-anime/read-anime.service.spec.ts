import { Test, TestingModule } from '@nestjs/testing';
import { ReadAnimeService } from './read-anime.service';

describe('ReadAnimeService', () => {
  let service: ReadAnimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadAnimeService],
    }).compile();

    service = module.get<ReadAnimeService>(ReadAnimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
