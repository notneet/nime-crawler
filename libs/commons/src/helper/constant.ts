export const SymMaxConLimit = Symbol('MAXCONLIMIT');
export const SymDefaultConfig = Symbol('DEFAULTCONFIG');
export const Q_ANIME_SOURCE = Symbol('Q_anime_source');
export const Q_ANIME_SOURCE_DETAIL = Symbol('Q_anime_source_detail');
export const Q_ANIME_SOURCE_STREAM = Symbol('Q_anime_source_stream');
export const Q_ROUTING_QUEUE = Symbol('Q_routing_queue');

export enum EnvKey {
  DATABASE_URL = 'DATABASE_URL',
  RMQ_URL = 'RMQ_URL',
  PROXY_SERVER = 'PROXY_SERVER',
  SCRAPE_TYPE = 'SCRAPE_TYPE',
  APP_NAME = 'APP_NAME',
  GIT_REPOSITORY = 'GIT_REPOSITORY',
  V1_VERSION = 'V1_VERSION',
  SENTRY_DSN = 'SENTRY_DSN',
  APP_ENV = 'APP_ENV',
  APP_CODE = 'APP_CODE',
  RATE_LIMIT_SECOND = 'RATE_LIMIT_SECOND',
  RATE_LIMIT_COUNT = 'RATE_LIMIT_COUNT',
}

export enum DefKey {
  CRON_INTERVAL = 'CRON_INTERVAL',
  Q_ANIME_SOURCE = 'ANIME_SOURCE',
  Q_ANIME_SOURCE_DETAIL = 'ANIME_SOURCE_DETAIL',
  Q_ROUTING_QUEUE = 'ROUTING_QUEUE',
  Q_ANIME_SOURCE_STREAM = 'ANIME_SOURCE_STREAM',
  DB_ANIME_DATA = 'anime_data',
}

export enum EventKey {
  READ_ANIME_SOURCE = 'read_anime_source',
  READ_ANIME_DETAIL = 'read_anime_detail',
  READ_ANIME_STREAM = 'read_anime_stream',
}

export namespace TimeUnit {
  export const SECOND = 1000;
  export const MINUTE = SECOND * 60;
  export const HOUR = MINUTE * 60;
  export const DAY = HOUR * 24;
  export const WEEK = DAY * 7;
}

export enum NodeItem {
  // Pattern Post //
  CONTAINER = 'CONTAINER',
  LINK_PATTERN = 'LINK_PATTERN',
  RESULT_TYPE = 'RESULT_TYPE',
  PAGINATION_PATTERN = 'PAGINATION_PATTERN',

  // Pattern Post Detail //
  POST_CONTAINER = 'POST_CONTAINER',
  POST_TITLE = 'POST_TITLE',
  POST_TITLE_JP = 'POST_TITLE_JP',
  POST_TITLE_EN = 'POST_TITLE_EN',
  POST_TYPE = 'POST_TYPE',
  POST_SCORE = 'POST_SCORE',
  POST_STATUS = 'POST_STATUS',
  POST_DURATION = 'POST_DURATION',
  POST_TOTAL_EPISODE = 'POST_TOTAL_EPISODE',
  POST_SEASON = 'POST_SEASON',
  POST_GENRES = 'POST_GENRES',
  POST_PRODUCERS = 'POST_PRODUCERS',
  POST_DESCRIPTION = 'POST_DESCRIPTION',
  POST_COVER = 'POST_COVER',
  EPISODE_PATTERN = 'EPISODE_PATTERN',
}
