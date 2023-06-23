import { Test, TestingModule } from '@nestjs/testing';
import { ReadAnimePostService } from './read-anime-post.service';

describe('ReadAnimePostService', () => {
  let service: ReadAnimePostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadAnimePostService],
    }).compile();

    service = module.get<ReadAnimePostService>(ReadAnimePostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
