import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  UseInterceptors,
} from '@nestjs/common';
import { ScraperStreamService } from './scraper-stream.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AcknolageMessageInterceptor } from './interceptors/acknolage-message.interceptor';
import { EventKey, Q_ANIME_SOURCE_STREAM } from '@libs/commons/helper/constant';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
@UseInterceptors(AcknolageMessageInterceptor)
export class ScraperStreamController implements OnModuleInit {
  constructor(
    @Inject(Q_ANIME_SOURCE_STREAM)
    private readonly clientStream: ClientProxy,
    private readonly scraperStreamService: ScraperStreamService,
  ) {}

  @EventPattern(EventKey.READ_ANIME_STREAM)
  async handleAnimeStream(@Payload() data: string) {
    console.log(data);
  }

  async onModuleInit() {
    // await this.populateJob();
  }

  @Cron(CronExpression.EVERY_3_HOURS)
  async populateJob() {
    this.emitJobStream('Hello World!!!');
  }

  private async emitJobStream(data: string) {
    this.clientStream.emit(EventKey.READ_ANIME_STREAM, data);
  }

  @Get()
  getHello(): string {
    return this.scraperStreamService.getHello();
  }
}
