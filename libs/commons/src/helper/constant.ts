export const SymMaxConLimit = Symbol('MAXCONLIMIT');
export const SymDefaultConfig = Symbol('DEFAULTCONFIG');

export enum EnvKey {
  NODE_ENV = 'NODE_ENV',
  DATABASE_URL = 'DATABASE_URL',
  RMQ_URL = 'RMQ_URL',
}

export enum DefKey {
  CRON_INTERVAL = 'CRON_INTERVAL',
  Q_ANIME_SOURCE = 'ANIME_SOURCE',
  DB_ANIME_DATA = 'anime_data',
}

export enum EventKey {
  READ_ANIME_SOURCE = 'read_anime_source',
}

export const Q_ANIME_SOURCE = Symbol('ANIME_SOURCE');
