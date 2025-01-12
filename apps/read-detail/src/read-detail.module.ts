import { rmqExchange } from '@commons';
import { AnimeModelModule } from '@commons/anime-model/anime-model.module';
import { HtmlModule } from '@commons/html/html.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorModule } from '@helpers/rabbitmq-populator/rabbitmq-populator.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReadDetailController } from './read-detail.controller';
import { ReadDetailService } from './read-detail.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({
        ...rmqExchange.config,
      }),
    }),
    RabbitmqPopulatorModule,
    HtmlModule,
    AnimeModelModule,
  ],
  controllers: [ReadDetailController],
  providers: [ReadDetailService],
})
export class ReadDetailModule {}
