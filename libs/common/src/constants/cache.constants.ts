/**
 * Cache key prefixes
 */
export const CACHE_KEYS = {
  ANIME: 'anime',
  EPISODE: 'episode',
  SOURCE: 'source',
  GENRE: 'genre',
  SEARCH: 'search',
  POPULAR: 'popular',
  RECENT: 'recent',
  STATS: 'stats',
} as const;

/**
 * Cache TTL values in seconds
 */
export const CACHE_TTL = {
  ANIME_DETAIL: 3600, // 1 hour
  ANIME_LIST: 1800, // 30 minutes
  EPISODE_LIST: 3600, // 1 hour
  SEARCH_RESULTS: 900, // 15 minutes
  POPULAR_ANIME: 7200, // 2 hours
  RECENT_ANIME: 1800, // 30 minutes
  GENRE_LIST: 86400, // 24 hours
  SOURCE_LIST: 86400, // 24 hours
  STATS: 3600, // 1 hour
} as const;

/**
 * Cache key generators
 */
export const CACHE_KEY_GENERATORS = {
  anime: (id: number) => `${CACHE_KEYS.ANIME}:${id}`,
  animeBySlug: (slug: string) => `${CACHE_KEYS.ANIME}:slug:${slug}`,
  animeList: (page: number, limit: number) =>
    `${CACHE_KEYS.ANIME}:list:${page}:${limit}`,
  episode: (id: number) => `${CACHE_KEYS.EPISODE}:${id}`,
  episodesByAnime: (animeId: number) =>
    `${CACHE_KEYS.EPISODE}:anime:${animeId}`,
  source: (id: number) => `${CACHE_KEYS.SOURCE}:${id}`,
  sourceBySlug: (slug: string) => `${CACHE_KEYS.SOURCE}:slug:${slug}`,
  genre: (id: number) => `${CACHE_KEYS.GENRE}:${id}`,
  search: (query: string, page: number) =>
    `${CACHE_KEYS.SEARCH}:${query}:${page}`,
  popular: (limit: number) => `${CACHE_KEYS.POPULAR}:${limit}`,
  recent: (limit: number) => `${CACHE_KEYS.RECENT}:${limit}`,
  stats: () => `${CACHE_KEYS.STATS}:global`,
} as const;
