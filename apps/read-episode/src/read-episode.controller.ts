import { rmqExchange } from '@commons';
import { HtmlService } from '@commons/html/html.service';
import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ReadEpisodeService } from './read-episode.service';

@Controller()
export class ReadEpisodeController {
  private readonly logger = new Logger(ReadEpisodeController.name);

  constructor(
    private readonly readEpisodeService: ReadEpisodeService,
    private readonly htmlService: HtmlService,
  ) {}

  @RabbitSubscribe({
    exchange: rmqExchange.exchangeName,
    routingKey: rmqExchange.exchangeKey.EPISODE,
    queue: rmqExchange.queueName.EPISODE,
    // batchOptions: { size: 0, timeout: 5000 },
    queueOptions: {
      channel: rmqExchange.config.channels.fast.key,
      deadLetterRoutingKey: rmqExchange.exchangeKey.ERROR,
      deadLetterExchange: rmqExchange.exchangeName,
      durable: true,
    },
  })
  async handleReadEpisode(data: PayloadMessage): Promise<number> {
    const start = DateTime.now();
    this.logger.verbose(`Received payload at ${start.toISO()}`);

    const rawHTML = await this.htmlService.load(data?.page_url);

    await this.readEpisodeService.wait(10);

    const parsed = this.htmlService.parseEpisode(
      data?.media_id,
      data?.page_url,
      data?.page_num,
      rawHTML,
    );

    console.log(parsed?.data?.download_list);

    console.log(
      '\n=============================================================\n',
    );

    console.dir(parsed?.data?.mirror_list, { depth: null });

    const end = DateTime.now();
    const duration = end.diff(start).as('seconds');
    this.logger.verbose(`Finished at ${end.toISO()}`);
    this.logger.log(`Elapsed time: ${duration}sec`);

    return 0;
  }

  getHello(): string {
    return this.readEpisodeService.getHello();
  }
}
