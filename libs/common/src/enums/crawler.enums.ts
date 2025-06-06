export enum CrawlJobType {
  FULL_CRAWL = 'full_crawl',
  UPDATE_CRAWL = 'update_crawl',
  SINGLE_ANIME = 'single_anime',
  HEALTH_CHECK = 'health_check',
  NEW_EPISODES = 'new_episodes',
  FIX_BROKEN_LINKS = 'fix_broken_links',
}

export enum CrawlJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// New crawler-specific enums
export enum CrawlStatus {
  PENDING = 'pending',
  SUCCESS = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum ScrollBehavior {
  NONE = 'none',
  BOTTOM = 'bottom',
  INCREMENTAL = 'incremental',
}

export enum DataType {
  STRING = 'string',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  DATE = 'date',
  URL = 'url',
  ARRAY = 'array',
}

export enum ErrorType {
  TIMEOUT = 'timeout',
  CONNECTION_ERROR = 'connection_error',
  HTTP_ERROR = 'http_error',
  PARSE_ERROR = 'parse_error',
  BLOCKED = 'blocked',
}

export enum PageTypeName {
  LIST = 'list',
  DETAIL = 'detail',
  EPISODE = 'episode',
}

export enum SelectorTypeName {
  CSS = 'css',
  XPATH = 'xpath',
  REGEX = 'regex',
  JSON_PATH = 'json_path',
}

export enum VideoQuality {
  SD_480P = '480p',
  HD_720P = '720p',
  FHD_1080P = '1080p',
  QHD_1440P = '1440p',
  UHD_4K = '4k',
  UHD_8K = '8k',
}

export enum FileFormat {
  MP4 = 'mp4',
  MKV = 'mkv',
  AVI = 'avi',
  WEBM = 'webm',
  MOV = 'mov',
}
