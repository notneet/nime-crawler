import { Test, TestingModule } from '@nestjs/testing';
import { ReadAnimePostController } from './read-anime-post.controller';

describe('ReadAnimePostController', () => {
  let controller: ReadAnimePostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadAnimePostController],
    }).compile();

    controller = module.get<ReadAnimePostController>(ReadAnimePostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
