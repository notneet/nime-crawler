import { rmqExchange } from '@commons';
import { AnimeEpisodeModelModule } from '@commons/anime-episode-model/anime-episode-model.module';
import { HtmlModule } from '@commons/html/html.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { BrowserModule } from '@helpers/browser/browser.module';
import { RabbitmqPopulatorModule } from '@helpers/rabbitmq-populator/rabbitmq-populator.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReadEpisodeController } from './read-episode.controller';
import { ReadEpisodeService } from './read-episode.service';

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
    BrowserModule,
    AnimeEpisodeModelModule,
  ],
  controllers: [ReadEpisodeController],
  providers: [ReadEpisodeService],
})
export class ReadEpisodeModule {}
