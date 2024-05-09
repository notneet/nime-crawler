import { Test, TestingModule } from '@nestjs/testing';
import { PostPatternEpisodeController } from './post-pattern-episode.controller';
import { PostPatternEpisodeService } from './post-pattern-episode.service';

describe('PostPatternEpisodeController', () => {
  let controller: PostPatternEpisodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostPatternEpisodeController],
      providers: [PostPatternEpisodeService],
    }).compile();

    controller = module.get<PostPatternEpisodeController>(PostPatternEpisodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
