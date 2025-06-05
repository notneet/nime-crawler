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
