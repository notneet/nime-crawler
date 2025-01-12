import { rmqExchange } from '@commons';
import { HtmlService } from '@commons/html/html.service';
import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorService } from '@helpers/rabbitmq-populator/rabbitmq-populator.service';
import { Controller, Logger } from '@nestjs/common';
import { arrayNotEmpty, isEmpty, isNotEmpty } from 'class-validator';
import { DateTime } from 'luxon';
import { ResultSetHeader } from 'mysql2';
import { ReadDetailService } from './read-detail.service';

@Controller()
export class ReadDetailController {
  private readonly logger = new Logger(ReadDetailController.name);

  constructor(
    private readonly readDetailService: ReadDetailService,
    private readonly htmlService: HtmlService,
    private readonly rabbitmqPopulatorService: RabbitmqPopulatorService,
  ) {}

  @RabbitSubscribe({
    exchange: rmqExchange.exchangeName,
    routingKey: rmqExchange.exchangeKey.DETAIL,
    queue: rmqExchange.queueName.DETAIL,
    // batchOptions: { size: 0, timeout: 5000 },
    queueOptions: {
      channel: rmqExchange.config.channels.fast.key,
      deadLetterRoutingKey: rmqExchange.exchangeKey.ERROR,
      deadLetterExchange: rmqExchange.exchangeName,
      durable: true,
    },
  })
  async handleReadIndex(data: PayloadMessage): Promise<number> {
    const start = DateTime.now();
    this.logger.verbose(`Received payload at ${start.toISO()}`);

    if (!arrayNotEmpty(data?.pattern_detail)) {
      this.logger.log(`Empty pattern: ${data?.page_url}`);

      return 1;
    }

    const rawHTML = await this.htmlService.load(data?.page_url);

    if (isEmpty(rawHTML)) {
      this.logger.log(`Empty page: ${data?.page_url}`);

      return 1;
    }

    await this.readDetailService.wait(10);

    const parsed = this.htmlService.parseDetail(
      data?.media_id,
      data?.page_url,
      data?.page_num,
      rawHTML,
      data?.pattern_detail,
    );

    let animeId: string = null;
    if (isNotEmpty(parsed?.data)) {
      const resInsert = await this.readDetailService.save(
        parsed?.data,
        data?.media_id,
        data?.page_url,
      );
      const rawData: ResultSetHeader = resInsert.raw;

      if (rawData.affectedRows > 0) {
        animeId = BigInt(rawData.insertId).toString();
      }
    }

    if (isNotEmpty(parsed?.data?.episode_url)) {
      await this.sendPayloadLink(data, parsed?.data?.episode_url, animeId);
    }

    if (isNotEmpty(parsed?.data?.batch_url)) {
      await this.sendPayloadLink(data, parsed?.data?.batch_url, animeId);
    }

    if (arrayNotEmpty(parsed?.data?.episode_list)) {
      for (const dataEpisode of parsed?.data?.episode_list) {
        await this.sendPayloadEpisode(data, dataEpisode.url, animeId);
      }
    }

    const end = DateTime.now();
    const duration = end.diff(start).as('seconds');
    this.logger.verbose(`Finished at ${end.toISO()}`);
    this.logger.log(`Elapsed time: ${duration}sec`);

    return 0;
  }

  private async sendPayloadLink(
    data: PayloadMessage,
    pageUrl: string,
    animeId: string,
  ): Promise<number> {
    try {
      const mappedPayload =
        this.readDetailService.constructPayloadAnimeDownload(
          data,
          pageUrl,
          1,
          animeId,
        );

      await this.rabbitmqPopulatorService.sendToRMQ(
        '',
        rmqExchange.exchangeKey.LINK,
        mappedPayload,
      );

      return 0;
    } catch (error) {
      this.logger.error(error);
      return 1;
    }
  }

  private async sendPayloadEpisode(
    data: PayloadMessage,
    pageUrl: string,
    animeId: string,
  ): Promise<number> {
    try {
      const mappedPayload =
        this.readDetailService.constructPayloadAnimeDownload(
          data,
          pageUrl,
          1,
          animeId,
        );

      await this.rabbitmqPopulatorService.sendToRMQ(
        '',
        rmqExchange.exchangeKey.EPISODE,
        mappedPayload,
      );

      return 0;
    } catch (error) {
      this.logger.error(error);
      return 1;
    }
  }
}
