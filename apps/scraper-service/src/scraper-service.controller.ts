import { Controller, Get } from '@nestjs/common';
import { ScraperServiceService } from './scraper-service.service';

@Controller()
export class ScraperServiceController {
  constructor(private readonly scraperServiceService: ScraperServiceService) {}

  @Get()
  getHello(): string {
    return this.scraperServiceService.getHello();
  }
}
