import { rmqExchange } from '@commons';
import { HtmlService } from '@commons/html/html.service';
import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorService } from '@helpers/rabbitmq-populator/rabbitmq-populator.service';
import { Controller, Logger } from '@nestjs/common';
import { arrayNotEmpty, isEmpty } from 'class-validator';
import { DateTime } from 'luxon';
import { ReadIndexService } from './read-index.service';

@Controller()
export class ReadIndexController {
  private readonly logger = new Logger(ReadIndexController.name);

  constructor(
    private readonly readIndexService: ReadIndexService,
    private readonly htmlService: HtmlService,
    private readonly rabbitmqPopulatorService: RabbitmqPopulatorService,
  ) {}

  @RabbitSubscribe({
    exchange: rmqExchange.exchangeName,
    routingKey: rmqExchange.exchangeKey.INDEX,
    queue: rmqExchange.queueName.INDEX,
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

    if (!arrayNotEmpty(data?.pattern_index)) {
      this.logger.log(`Empty pattern: ${data?.page_url}`);

      return 1;
    }

    const rawHTML = await this.htmlService.load(data?.page_url);

    if (isEmpty(rawHTML)) {
      this.logger.log(`Empty page: ${data?.page_url}`);

      return 1;
    }

    await this.readIndexService.wait(10);

    const parsed = this.htmlService.parseIndex(
      data?.media_id,
      data?.page_url,
      data?.page_num,
      rawHTML,
      data?.pattern_index,
    );

    for (const dataDetail of parsed.data) {
      const mappedPayload = this.readIndexService.constructPayloadAnimeDetail(
        data,
        dataDetail.url,
        1,
      );

      await this.rabbitmqPopulatorService.sendToRMQ(
        '',
        rmqExchange.exchangeKey.DETAIL,
        mappedPayload,
      );
    }

    const end = DateTime.now();
    const duration = end.diff(start).as('seconds');
    this.logger.verbose(`Finished at ${end.toISO()}`);
    this.logger.log(`Elapsed time: ${duration}sec`);

    return 0;
  }
}
