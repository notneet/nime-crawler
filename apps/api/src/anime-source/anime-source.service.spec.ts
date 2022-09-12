import { Test, TestingModule } from '@nestjs/testing';
import { AnimeSourceService } from './anime-source.service';

describe('AnimeSourceService', () => {
  let service: AnimeSourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnimeSourceService],
    }).compile();

    service = module.get<AnimeSourceService>(AnimeSourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
