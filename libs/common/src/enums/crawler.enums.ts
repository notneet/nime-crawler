export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  DNS_ERROR = 'dns_error',
  SSL_ERROR = 'ssl_error',
  HTTP_ERROR = 'http_error',
  PARSING_ERROR = 'parsing_error',
  SELECTOR_ERROR = 'selector_error',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT = 'rate_limit',
  CAPTCHA = 'captcha',
  BLOCKED = 'blocked',
  UNKNOWN = 'unknown',
}

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  URL = 'url',
  EMAIL = 'email',
  JSON = 'json',
  ARRAY = 'array',
  HTML = 'html',
  TEXT = 'text',
}

export enum ScrollBehavior {
  NONE = 'none',
  TOP = 'top',
  BOTTOM = 'bottom',
  ELEMENT = 'element',
  LAZY_LOAD = 'lazy_load',
  INFINITE_SCROLL = 'infinite_scroll',
}

export enum CrawlStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RATE_LIMITED = 'rate_limited',
}

export enum SelectorTypeName {
  CSS = 'css',
  XPATH = 'xpath',
  REGEX = 'regex',
  JSON_PATH = 'json_path',
  TEXT_CONTAINS = 'text_contains',
  ATTRIBUTE = 'attribute',
  PSEUDO = 'pseudo',
}

export enum PageTypeName {
  HOME = 'home',
  ANIME_LIST = 'anime_list',
  ANIME_DETAIL = 'anime_detail',
  EPISODE_LIST = 'episode_list',
  EPISODE_DETAIL = 'episode_detail',
  SEARCH_RESULTS = 'search_results',
  GENRE_PAGE = 'genre_page',
  POPULAR_PAGE = 'popular_page',
  LATEST_PAGE = 'latest_page',
  ONGOING_PAGE = 'ongoing_page',
  COMPLETED_PAGE = 'completed_page',
}
