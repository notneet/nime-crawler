import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { buildRabbitConfig, AdapterService } from '@libs/commons';
import { Adapter } from '@libs/commons/entities';
import { ControlController } from './control.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'better-sqlite3' as const,
        database: cfg.get<string>('SQLITE_PATH', 'data/results.sqlite'),
        entities: [Adapter],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([Adapter]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        buildRabbitConfig(cfg.get<string>('RMQ_URI', 'amqp://guest:guest@localhost:5672')),
    }),
  ],
  controllers: [ControlController],
  providers: [AdapterService],
})
export class AppModule {}
