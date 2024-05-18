import { Test, TestingModule } from '@nestjs/testing';
import { PostPatternEpisodeService } from './post-pattern-episode.service';

describe('PostPatternEpisodeService', () => {
  let service: PostPatternEpisodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostPatternEpisodeService],
    }).compile();

    service = module.get<PostPatternEpisodeService>(PostPatternEpisodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
