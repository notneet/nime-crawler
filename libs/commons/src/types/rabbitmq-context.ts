import { RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
export declare class RabbitMQCtx extends RmqContext {
  getMessage(): Message;
  getChannelRef(): Channel;
}
