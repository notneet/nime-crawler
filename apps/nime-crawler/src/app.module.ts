import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig, SiteRegistry, otakudesuAdapter } from '@libs/commons';
import { ControlController } from './control.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
    }),
  ],
  controllers: [ControlController],
  providers: [{ provide: SiteRegistry, useFactory: () => new SiteRegistry([otakudesuAdapter]) }],
})
export class AppModule {}
