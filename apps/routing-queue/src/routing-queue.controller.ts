import {
  DefKey,
  EventKey,
  Q_ANIME_SOURCE,
} from '@libs/commons/helper/constant';
import { RabbitMQCtx } from '@libs/commons/types/rabbitmq-context';
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy, Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { RoutingQueueService } from './routing-queue.service';
import { Channel, Message } from 'amqplib';
import { isEmpty } from 'class-validator';

@Controller()
export class RoutingQueueController {
  constructor(
    private readonly routingQueueService: RoutingQueueService,
    @Inject(Q_ANIME_SOURCE)
    private readonly clientReadAnimeSource: ClientProxy,
  ) {}

  @EventPattern(EventKey.READ_ANIME_SOURCE)
  async sendToReadAnimeSource(
    @Payload() data: any,
    @Ctx() context: RabbitMQCtx,
  ) {
    return this.handleRouting(context, data, DefKey.Q_ANIME_SOURCE);
  }

  handleRouting(ctx: RabbitMQCtx, payload: any, sendToQueue: string) {
    const channel = ctx.getChannelRef() as Channel;
    const message = ctx.getMessage() as Message;
    const ctxPattern = ctx.getPattern();
    const msg = Buffer.from(
      JSON.stringify({ pattern: ctxPattern, data: payload }),
    );

    if (isEmpty(payload)) {
      channel.reject(message, false);
      throw new Error(`cant routing ${'qwe'}`);
    }

    channel.sendToQueue(sendToQueue, msg);
    channel.ack(message);
  }

  @Get()
  getHello(): string {
    return this.routingQueueService.getHello();
  }
}
