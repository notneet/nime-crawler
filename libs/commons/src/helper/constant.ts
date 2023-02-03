export const SymMaxConLimit = Symbol('MAXCONLIMIT');
export const SymDefaultConfig = Symbol('DEFAULTCONFIG');
export const Q_ANIME_SOURCE = Symbol('Q_anime_source');
export const Q_ROUTING_QUEUE = Symbol('Q_routing_queue');

export enum EnvKey {
  NODE_ENV = 'NODE_ENV',
  DATABASE_URL = 'DATABASE_URL',
  RMQ_URL = 'RMQ_URL',
}

export enum DefKey {
  CRON_INTERVAL = 'CRON_INTERVAL',
  Q_ANIME_SOURCE = 'ANIME_SOURCE',
  Q_ROUTING_QUEUE = 'ROUTING_QUEUE',
  DB_ANIME_DATA = 'anime_data',
}

export enum EventKey {
  READ_ANIME_SOURCE = 'read_anime_source',
}

export namespace TimeUnit {
  export const SECOND = 1000;
  export const MINUTE = SECOND * 60;
  export const HOUR = MINUTE * 60;
  export const DAY = HOUR * 24;
  export const WEEK = DAY * 7;
}
