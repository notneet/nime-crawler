import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
dotenv.config();

export const animeDataDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  cache: true,
  poolSize: 2,
  maxQueryExecutionTime: 5000,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [__dirname + '/../../libs/entities/src/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: true,
  logging: true,
});
