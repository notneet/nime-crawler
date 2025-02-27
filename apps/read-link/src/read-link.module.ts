import { rmqExchange } from '@commons';
import { HtmlModule } from '@commons/html/html.module';
import { AnimeModelModule } from '@data-access/anime-model/anime-model.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorModule } from '@helpers/rabbitmq-populator/rabbitmq-populator.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReadLinkController } from './read-link.controller';
import { ReadLinkService } from './read-link.service';

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
  controllers: [ReadLinkController],
  providers: [ReadLinkService],
})
export class ReadLinkModule {}
