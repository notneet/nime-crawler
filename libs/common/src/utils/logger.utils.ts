import { LogLevel } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

export const initLogger = async () => {
  const configModule = await NestFactory.createApplicationContext(ConfigModule);
  const configService = configModule.get(ConfigService);
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const logger: LogLevel[] = isDevelopment
    ? ['log', 'error', 'warn', 'debug', 'verbose']
    : ['log', 'error', 'warn'];

  return {
    logger,
    configModule,
    configService,
  };
};
