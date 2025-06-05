import { Controller, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { CrawlerMicroservice } from './crawler.microservice';

@Controller()
export class CrawlerController implements OnApplicationBootstrap {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(private readonly crawlerMicroservice: CrawlerMicroservice) {}

  async onApplicationBootstrap() {
    this.logger.log('Crawler microservice starting...');
    // The microservice will initialize itself in onModuleInit
  }
}
