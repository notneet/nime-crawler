import { Controller, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawlerService } from './crawler.service';

@Controller()
export class CrawlerController implements OnApplicationBootstrap {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const result = await this.crawlerService.getAllAnime();
    console.dir(result, { depth: null });
  }
  // async onApplicationBootstrap() {
  // console.log('ok');
  // console.log(this.configService.get('database'));
  // const result = await this.crawlerService.getAllAnime();
  // console.log(result);
  // }
}
