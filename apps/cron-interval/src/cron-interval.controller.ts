import { EventKey, Q_ROUTING_QUEUE } from '@libs/commons/helper/constant';
import { Controller, Get, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronIntervalService } from './cron-interval.service';

@Controller()
export class CronIntervalController implements OnModuleInit {
  private readonly logger = new Logger(CronIntervalController.name);

  constructor(
    private readonly cronIntervalService: CronIntervalService,
    @Inject(Q_ROUTING_QUEUE) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.genPayload();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async genPayload() {
    return this.cronIntervalService.doJob();
    // const res = await this.cronIntervalService.getAllAnimeResource();
    // console.log(res);
    const msg = { message: `ok from ${CronIntervalController.name}` };
    // this.client.emit(
    //   EventKey.READ_ANIME_SOURCE,
    //   JSON.stringify({
    //     message: msg,
    //     date: new Date().getTime(),
    //   }),
    // );
    return this.logger.debug(`send`, msg);
  }

  @Get()
  getHello(): string {
    return this.cronIntervalService.getHello();
  }
}
