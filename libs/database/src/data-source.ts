import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

require('dotenv').config();

const AppDataSource: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'anime_crawler',
  entities: [
    // Core entities
    join(__dirname, '../../../libs/common/src/entities/core/*.entity{.ts,.js}'),
    // Crawler entities
    join(
      __dirname,
      '../../../libs/common/src/entities/crawler/*.entity{.ts,.js}',
    ),
    // Monitoring entities
    join(
      __dirname,
      '../../../libs/common/src/entities/monitoring/*.entity{.ts,.js}',
    ),
    // Queue entities
    join(
      __dirname,
      '../../../libs/common/src/entities/queue/*.entity{.ts,.js}',
    ),
    // Cache entities
    join(
      __dirname,
      '../../../libs/common/src/entities/cache/*.entity{.ts,.js}',
    ),
  ],
  migrations: [
    // Migrations in database lib
    join(__dirname, './migrations/*{.ts,.js}'),
  ],
  synchronize: process.env.NODE_ENV === 'development',
  logging:
    process.env.NODE_ENV === 'development'
      ? ['error', 'info', 'log', 'migration', 'query', 'schema', 'warn']
      : ['error'],
  timezone: 'Z',
  charset: 'utf8mb4',
  extra: {
    connectionLimit:
      parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10) || 10,
    // MySQL2 specific options
    connectTimeout: 60000,
    waitForConnections: true,
    queueLimit: 0,
  },
  maxQueryExecutionTime: 5000,
  // Enable TypeORM query result caching with Redis
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_TYPEORM_DB || '2', 10) || 2,
    },
    duration: 30000, // 30 seconds default cache
  },
};

export default AppDataSource;
