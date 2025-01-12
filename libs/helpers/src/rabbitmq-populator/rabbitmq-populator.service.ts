import { rmqExchange } from '@commons';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RabbitmqPopulatorService {
  private readonly logger = new Logger(RabbitmqPopulatorService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async sendToRMQ(
    eventMsg: string,
    routingKey: string,
    message: Record<string, any>,
  ) {
    try {
      const payloadRMQ = {
        // pattern: eventMsg,
        ...message,
      };

      return await Promise.resolve(
        this.amqpConnection.publish(
          rmqExchange.exchangeName,
          routingKey,
          payloadRMQ,
          {
            persistent: true,
            mandatory: true,
          },
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error.message}`);
      throw error;
    }
  }
}
