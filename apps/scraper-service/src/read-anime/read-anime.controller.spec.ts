import { Test, TestingModule } from '@nestjs/testing';
import { ReadAnimeController } from './read-anime.controller';

describe('ReadAnimeController', () => {
  let controller: ReadAnimeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadAnimeController],
    }).compile();

    controller = module.get<ReadAnimeController>(ReadAnimeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
