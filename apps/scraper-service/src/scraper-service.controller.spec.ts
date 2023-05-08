import { Test, TestingModule } from '@nestjs/testing';
import { ScraperServiceController } from './scraper-service.controller';
import { ScraperServiceService } from './scraper-service.service';

describe('ScraperServiceController', () => {
  let scraperServiceController: ScraperServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ScraperServiceController],
      providers: [ScraperServiceService],
    }).compile();

    scraperServiceController = app.get<ScraperServiceController>(ScraperServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(scraperServiceController.getHello()).toBe('Hello World!');
    });
  });
});
