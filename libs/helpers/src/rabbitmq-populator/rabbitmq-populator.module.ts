import { rmqExchange } from '@commons';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { RabbitmqPopulatorService } from './rabbitmq-populator.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({ ...rmqExchange.config }),
    }),
  ],
  providers: [RabbitmqPopulatorService],
  exports: [RabbitmqPopulatorService],
})
export class RabbitmqPopulatorModule {}
