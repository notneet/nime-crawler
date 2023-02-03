import { queueConfig } from '@libs/commons/config/main';
import {
  DefKey,
  Q_ANIME_SOURCE,
  Q_ROUTING_QUEUE,
} from '@libs/commons/helper/constant';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { RoutingQueueController } from './routing-queue.controller';
import { RoutingQueueService } from './routing-queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: Q_ANIME_SOURCE,
        inject: [ConfigService],
        useFactory(config: ConfigService) {
          return queueConfig(
            config,
            config.get<string>(DefKey.Q_ANIME_SOURCE, DefKey.Q_ANIME_SOURCE),
          );
        },
      },
    ]),
  ],
  controllers: [RoutingQueueController],
  providers: [RoutingQueueService],
})
export class RoutingQueueModule {}
