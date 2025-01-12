import { rmqExchange } from '@commons';
import { HtmlService } from '@commons/html/html.service';
import { RabbitmqPopulatorService } from '@helpers/rabbitmq-populator/rabbitmq-populator.service';
import { Controller, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TestRepository } from '@repositories/repositories/test.repository';
import { from, map } from 'rxjs';
import { CronIntervalService } from './cron-interval.service';

@Controller()
export class CronIntervalController implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronIntervalController.name);

  constructor(
    private readonly cronIntervalService: CronIntervalService,
    private readonly testRepository: TestRepository,
    private readonly rabbitmqPopulatorService: RabbitmqPopulatorService,
    private readonly htmlService: HtmlService,
  ) {}

  async onApplicationBootstrap() {
    // await this.handleCron();
    await this.initJob();
    // await this.loadHtml();
  }

  // async loadHtml(): Promise<number> {
  //   // const pageUrl = 'https://otakudesu.cloud/anime-list/';
  //   // const pageUrl = 'https://checker.soax.com/api/ipinfo';
  //   const pageUrl = 'https://www.google.com';
  //   const res = await this.htmlService.load(pageUrl);
  //   const data = this.htmlService.parseIndex(res);
  //   console.log(data);

  //   return 0;
  // }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async initJob(): Promise<number> {
    const filteredJob =
      await this.cronIntervalService.getJobFilteredByIntervalMinute();
    const medias = await this.cronIntervalService.getAllMedia();
    const patternIndexes = await this.cronIntervalService.getAllPatternIndex();
    const patternDetails = await this.cronIntervalService.getAllPatternDetail();
    const patternWatches = await this.cronIntervalService.getAllPatternWatch();
    const patternLinks = await this.cronIntervalService.getAllPatternLink();

    from(filteredJob)
      .pipe(
        map(async (filtered) => {
          const mappedPayload =
            this.cronIntervalService.constructPayloadAnimeIndex(
              filtered,
              filtered?.media_id,
              medias,
              patternIndexes,
              patternDetails,
              patternWatches,
              patternLinks,
            );

          this.logger.log(
            `init ${mappedPayload?.page_url} (${mappedPayload?.media_id})...`,
          );

          await this.rabbitmqPopulatorService.sendToRMQ(
            '',
            rmqExchange.exchangeKey.INDEX,
            mappedPayload,
          );
        }),
      )
      .subscribe();

    return 0;
  }

  // @Cron(CronExpression.EVERY_SECOND)
  // async handleCron() {
  //   const date = new Date();
  //   const second = date.getSeconds();
  //   const tests = await this.testRepository.findAllRow();
  //   const routingKey =
  //     second % 2 === 0
  //       ? rmqExchange.exchangeKey.DETAIL
  //       : rmqExchange.exchangeKey.INDEX;
  //   await this.rabbitmqPopulatorService.sendToRMQ(
  //     '',
  //     routingKey,
  //     JSON.stringify(tests),
  //   );
  // }

  // @RabbitSubscribe({
  //   exchange: rmqExchange.exchangeName,
  //   routingKey: rmqExchange.exchangeKey.INDEX,
  //   queue: rmqExchange.queueName.INDEX,
  // })
  // async handleMessage(payload: { message: string }) {
  //   console.log('handleMessage', `Message received:`, payload?.message);
  // }

  // @RabbitSubscribe({
  //   exchange: rmqExchange.exchangeName,
  //   routingKey: rmqExchange.exchangeKey.DETAIL,
  //   queue: rmqExchange.queueName.DETAIL,
  // })
  // async handleDetailMessage(payload: { message: string }) {
  //   console.log('handleDetailMessage', `Message received:`, payload?.message);
  // }
}
