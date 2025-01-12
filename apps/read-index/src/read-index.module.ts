import { rmqExchange } from '@commons';
import { HtmlModule } from '@commons/html/html.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqPopulatorModule } from '@helpers/rabbitmq-populator/rabbitmq-populator.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReadIndexController } from './read-index.controller';
import { ReadIndexService } from './read-index.service';

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
  ],
  controllers: [ReadIndexController],
  providers: [ReadIndexService],
})
export class ReadIndexModule {}
