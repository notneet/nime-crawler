import { Test, TestingModule } from '@nestjs/testing';
import { HtmlScraperService } from './html-scraper.service';

describe('HtmlScraperService', () => {
  let service: HtmlScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlScraperService],
    }).compile();

    service = module.get<HtmlScraperService>(HtmlScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
