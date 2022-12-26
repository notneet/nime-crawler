import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { EnvKey, SymMaxConLimit, SymDefaultConfig } from '../helper/constant';

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
  constructor(
    private readonly config: ConfigService,
    @Inject(SymMaxConLimit) private readonly maxConLimit: number,
    @Inject(SymDefaultConfig) private readonly defaultConfig: string,
  ) {}

  createTypeOrmOptions(connectionName?: string) {
    const logging: LoggerOptions = ['error'];

    if (this.config.get(EnvKey.NODE_ENV, 'prod') == 'log') {
      logging.push('warn', 'query');
    }

    connectionName = connectionName || this.defaultConfig;
    const config = {
      type: 'mariadb',
      cache: {
        type: 'redis',
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
      logging: logging,
      charset: 'utf8mb4_unicode_ci',
      extra: {
        charset: 'utf8mb4_unicode_ci',
        connectionLimit: this.maxConLimit,
      },
      keepConnectionAlive: true,
      autoLoadEntities: true,
      name: connectionName,
      ...this.getConnectionConfig(connectionName),
    } as MysqlConnectionOptions;

    if (this.config.get(EnvKey.NODE_ENV, 'prod') == 'log') {
      Logger.debug(config, connectionName);
    }

    return config;
  }

  getConnectionConfig(connectionName: string): MysqlConnectionOptions {
    if (connectionName === EnvKey.DATABASE_URL) {
      return {
        type: 'mariadb',
        url: this.config.get(EnvKey.DATABASE_URL),
      };
    }
  }
}
