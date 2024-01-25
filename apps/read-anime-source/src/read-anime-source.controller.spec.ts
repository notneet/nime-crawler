import { Test, TestingModule } from '@nestjs/testing';
import { ReadAnimeSourceController } from './read-anime-source.controller';
import { ReadAnimeSourceService } from './read-anime-source.service';

describe('ReadAnimeSourceController', () => {
  let readAnimeSourceController: ReadAnimeSourceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReadAnimeSourceController],
      providers: [ReadAnimeSourceService],
    }).compile();

    readAnimeSourceController = app.get<ReadAnimeSourceController>(ReadAnimeSourceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(readAnimeSourceController.getHello()).toBe('Hello World!');
    });
  });
});
