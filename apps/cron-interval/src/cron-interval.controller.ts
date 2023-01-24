import { EventKey, Q_ANIME_SOURCE } from '@libs/commons/helper/constant';
import { Controller, Get, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronIntervalService } from './cron-interval.service';

@Controller()
export class CronIntervalController implements OnModuleInit {
  private readonly logger = new Logger(CronIntervalController.name);

  constructor(
    private readonly cronIntervalService: CronIntervalService,
    @Inject(Q_ANIME_SOURCE) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.genPayload();
  }

  @Cron(CronExpression.EVERY_SECOND)
  async genPayload() {
    // const res = await this.cronIntervalService.getAllAnimeResource();
    // console.log(res);
    // const msg = { message: 'hello world!' };
    // this.client.emit(
    //   EventKey.READ_ANIME_SOURCE,
    //   JSON.stringify({
    //     message: 'ok from rmq!',
    //     date: new Date().getTime(),
    //   }),
    // );
    // return this.logger.debug(`send`, msg);
  }

  @Get()
  getHello(): string {
    return this.cronIntervalService.getHello();
  }
}
