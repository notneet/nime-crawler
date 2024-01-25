import { Test, TestingModule } from '@nestjs/testing';
import { AnimeSourceController } from './anime-source.controller';
import { AnimeSourceService } from './anime-source.service';

describe('AnimeSourceController', () => {
  let controller: AnimeSourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimeSourceController],
      providers: [AnimeSourceService],
    }).compile();

    controller = module.get<AnimeSourceController>(AnimeSourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
