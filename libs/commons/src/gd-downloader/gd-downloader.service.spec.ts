import { Test, TestingModule } from '@nestjs/testing';
import { GdDownloaderService } from './gd-downloader.service';

describe('GdDownloaderService', () => {
  let service: GdDownloaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GdDownloaderService],
    }).compile();

    service = module.get<GdDownloaderService>(GdDownloaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
