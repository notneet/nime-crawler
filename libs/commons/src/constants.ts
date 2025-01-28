import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Envs } from './env';
dotenv.config();

export const rmqExchange = {
  exchangeName: 'crawler',
  exchangeKey: {
    INDEX: 'index',
    DETAIL: 'detail',
    EPISODE: 'episode',
    LINK: 'link',
    OTHER: 'other',
    ERROR: 'error',
  },
  queueName: {
    INDEX: 'anime_index',
    DETAIL: 'anime_detail',
    EPISODE: 'anime_episode',
    LINK: 'anime_link',
  },
  config: {
    exchanges: [
      {
        name: 'crawler',
        type: 'topic',
      },
    ],
    uri: `${
      process.env[Envs.RMQ_URL]
        ? process.env[Envs.RMQ_URL]?.split('|')
        : undefined
    }`,
    channels: {
      normal: {
        key: 'normal',
        prefetchCount: 10,
        default: true,
      },
      fast: {
        key: 'fast',
        prefetchCount: 30,
      },
    },
    defaultRpcTimeout: 60000,
    connectionInitOptions: {
      wait: true,
      timeout: 60000,
      reject: true,
    },
    enableControllerDiscovery: true,
  },
};

export const dbConnection = {
  animeData: {
    type: 'mysql',
    url: process.env[Envs.DATABASE_URL],
    cache: true,
    poolSize: 100,
    maxQueryExecutionTime: 5000,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [__dirname + '/../../../libs/entities/src/*.entity{.ts,.js}'],
  } as TypeOrmModuleOptions,
};

export const defaultConfigLibXMLConfig = {
  encoding: 'UTF-8',
  whitespace: false,
  selfCloseEmpty: true,
  declaration: false,
  type: 'html',
} satisfies {
  declaration: boolean;
  selfCloseEmpty: boolean;
  whitespace: boolean;
  type: 'xml' | 'html' | 'xhtml';
  encoding?:
    | 'HTML'
    | 'ASCII'
    | 'UTF-8'
    | 'UTF-16'
    | 'ISO-Latin-1'
    | 'ISO-8859-1';
};

export const jwtConstants = {
  secret: process.env[Envs.JWT_SECRET],
  expiresIn: process.env[Envs.JWT_EXPIRES_IN],
  refreshExpiresIn: process.env[Envs.JWT_REF_EXPIRES_IN],
};
