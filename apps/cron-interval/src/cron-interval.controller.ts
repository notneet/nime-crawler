import { rmqExchange } from '@commons';
import { RabbitmqPopulatorService } from '@helpers/rabbitmq-populator/rabbitmq-populator.service';
import { Controller, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { from, map } from 'rxjs';
import { CronIntervalService } from './cron-interval.service';

@Controller()
export class CronIntervalController implements OnApplicationBootstrap {
  private readonly logger = new Logger(CronIntervalController.name);

  constructor(
    private readonly cronIntervalService: CronIntervalService,
    private readonly rabbitmqPopulatorService: RabbitmqPopulatorService,
  ) {}

  async onApplicationBootstrap() {
    await this.initJob();
    // await this.example();
  }

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
}
