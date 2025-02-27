import { rmqExchange } from '@commons';
import { HtmlService } from '@commons/html/html.service';
import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorService } from '@helpers/rabbitmq-populator/rabbitmq-populator.service';
import { Controller, Logger } from '@nestjs/common';
import { arrayNotEmpty } from 'class-validator';
import { DateTime } from 'luxon';
import { ReadLinkService } from './read-link.service';

@Controller()
export class ReadLinkController {
  private readonly logger = new Logger(ReadLinkController.name);

  constructor(
    private readonly readLinkService: ReadLinkService,
    private readonly htmlService: HtmlService,
    private readonly rabbitmqPopulatorService: RabbitmqPopulatorService,
  ) {}

  @RabbitSubscribe({
    exchange: rmqExchange.exchangeName,
    routingKey: rmqExchange.exchangeKey.LINK,
    queue: rmqExchange.queueName.LINK,
    // batchOptions: { size: 0, timeout: 5000 },
    queueOptions: {
      channel: rmqExchange.config.channels.fast.key,
      deadLetterRoutingKey: rmqExchange.exchangeKey.ERROR,
      deadLetterExchange: rmqExchange.exchangeName,
      durable: true,
    },
  })
  async handleReadLink(data: PayloadMessage): Promise<number> {
    const start = DateTime.now();
    this.logger.verbose(`Received payload at ${start.toISO()}`);

    if (!arrayNotEmpty(data?.pattern_link)) {
      this.logger.log(`Empty pattern: ${data?.page_url}`);

      return 1;
    }

    const rawHTML = await this.htmlService.load(data?.page_url);

    await this.readLinkService.wait(10);

    const parsed = this.htmlService.parseLink(
      data?.media_id,
      data?.page_url,
      data?.page_num,
      rawHTML,
      data?.pattern_link,
    );

    if (arrayNotEmpty(parsed?.data)) {
      // await this.readLinkService.saveEpisode(
      //   data?.page_url,
      //   parsed?.data,
      //   data?.media_id,
      //   BigInt(data?.dataId),
      // );

      await this.readLinkService.updateAnime(
        parsed?.data,
        data?.media_id,
        BigInt(data?.dataId),
      );
    }

    const end = DateTime.now();
    const duration = end.diff(start).as('seconds');
    this.logger.verbose(`Finished at ${end.toISO()}`);
    this.logger.log(`Elapsed time: ${duration}sec`);

    return 0;
  }
}
