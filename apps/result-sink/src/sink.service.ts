import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { AmqpConnection, Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES, ParsedResultDto, routingKey, TimingInterceptor } from '@libs/commons';

@Injectable()
export class SinkService {
  private readonly logger = new Logger(SinkService.name);

  constructor(private readonly amqp: AmqpConnection) {}

  @UseInterceptors(TimingInterceptor)
  @RabbitSubscribe({
    exchange: EXCHANGES.parsed,
    routingKey: 'parsed.#',
    queue: 'anime.parsed.sink',
    queueOptions: { durable: true, deadLetterExchange: EXCHANGES.dlx },
  })
  async onParsed(result: ParsedResultDto): Promise<void | Nack> {
    return this.handle(result);
  }

  async handle(result: ParsedResultDto): Promise<void | Nack> {
    try {
      await this.amqp.publish(
        EXCHANGES.results,
        routingKey('result', result.stage, result.source),
        result,
      );
      this.logger.log(`[${result.source}/${result.stage}] published result: ${result.url}`);
    } catch (err) {
      this.logger.error(`publish failed for ${result.source}/${result.stage}: ${(err as Error).message}`);
      return new Nack(false);
    }
  }
}
