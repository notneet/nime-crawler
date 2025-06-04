import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// ============ CORE ENTITIES ============

@Entity('sources')
@Index(['slug'], { unique: true })
export class Source {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string; // samehadaku, otakudesu, huntersekai, kusonime

  @Column({ type: 'text' })
  base_url: string;

  @Column({ type: 'json', nullable: true })
  selectors: any; // CSS selectors for scraping

  @Column({ type: 'json', nullable: true })
  headers: any; // Custom headers for requests

  @Column({ type: 'smallint', default: 1 })
  priority: number; // Crawling priority

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 5000 })
  delay_ms: number; // Delay between requests

  @Column({ type: 'timestamp', nullable: true })
  last_crawled_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Anime, (anime) => anime.source)
  animes: Anime[];

  @OneToMany(() => CrawlJob, (job) => job.source)
  crawl_jobs: CrawlJob[];
}

@Entity('anime')
@Index(['slug'], { unique: true })
@Index(['source_id', 'source_anime_id'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['release_year'])
export class Anime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  alternative_title: string;

  @Column({ type: 'text', nullable: true })
  synopsis: string;

  @Column({ type: 'text', nullable: true })
  poster_url: string;

  @Column({ type: 'text', nullable: true })
  banner_url: string;

  @Column({
    type: 'enum',
    enum: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'],
    default: 'TV',
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['Ongoing', 'Completed', 'Upcoming', 'Hiatus'],
    default: 'Ongoing',
  })
  status: string;

  @Column({ type: 'smallint', nullable: true })
  total_episodes: number;

  @Column({ type: 'smallint', nullable: true })
  release_year: number;

  @Column({
    type: 'enum',
    enum: ['Spring', 'Summer', 'Fall', 'Winter'],
    nullable: true,
  })
  season: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  download_count: number;

  // Source reference
  @Column()
  source_id: number;

  @Column({ length: 100 })
  source_anime_id: string; // Original ID from source site

  @Column({ type: 'text' })
  source_url: string;

  @Column({ type: 'timestamp', nullable: true })
  last_updated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Source, (source) => source.animes)
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @OneToMany(() => Episode, (episode) => episode.anime)
  episodes: Episode[];

  @ManyToMany(() => Genre, (genre) => genre.animes)
  @JoinTable({
    name: 'anime_genres',
    joinColumn: { name: 'anime_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @OneToMany(() => AnimeUpdateHistory, (history) => history.anime)
  update_history: AnimeUpdateHistory[];
}

@Entity('episodes')
@Index(['anime_id', 'episode_number'], { unique: true })
@Index(['anime_id'])
@Index(['source_episode_id'])
export class Episode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anime_id: number;

  @Column({ type: 'smallint' })
  episode_number: number;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ length: 100 })
  source_episode_id: string;

  @Column({ type: 'text' })
  source_url: string;

  @Column({ type: 'text', nullable: true })
  thumbnail_url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number;

  @Column({ type: 'date', nullable: true })
  air_date: Date;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  download_count: number;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_checked_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Anime, (anime) => anime.episodes)
  @JoinColumn({ name: 'anime_id' })
  anime: Anime;

  @OneToMany(() => DownloadLink, (link) => link.episode)
  download_links: DownloadLink[];
}

@Entity('download_links')
@Index(['episode_id'])
@Index(['provider'])
@Index(['quality'])
export class DownloadLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  episode_id: number;

  @Column({ length: 100 })
  provider: string; // Google Drive, Mega, MediaFire, etc.

  @Column({ type: 'text' })
  url: string;

  @Column({ length: 20 })
  quality: string; // 360p, 480p, 720p, 1080p

  @Column({ length: 20, nullable: true })
  format: string; // MP4, MKV, etc.

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_checked_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Episode, (episode) => episode.download_links)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Anime, (anime) => anime.genres)
  animes: Anime[];
}

// ============ CRAWLER MANAGEMENT ============

@Entity('crawl_jobs')
@Index(['source_id'])
@Index(['status'])
@Index(['job_type'])
@Index(['scheduled_at'])
export class CrawlJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source_id: number;

  @Column({
    type: 'enum',
    enum: ['full_crawl', 'update_check', 'new_episodes', 'fix_broken_links'],
  })
  job_type: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'json', nullable: true })
  parameters: any; // Job-specific parameters

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'json', nullable: true })
  result_summary: any; // Stats about job execution

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'int', default: 3 })
  max_retries: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Source, (source) => source.crawl_jobs)
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @OneToMany(() => CrawlLog, (log) => log.job)
  logs: CrawlLog[];
}

@Entity('crawl_logs')
@Index(['job_id'])
@Index(['level'])
@Index(['created_at'])
export class CrawlLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  job_id: number;

  @Column({ type: 'enum', enum: ['info', 'warning', 'error', 'debug'] })
  level: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  context: any; // Additional context data

  @Column({ type: 'text', nullable: true })
  url: string; // URL being processed when log was created

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => CrawlJob, (job) => job.logs)
  @JoinColumn({ name: 'job_id' })
  job: CrawlJob;
}

// ============ MONITORING & ANALYTICS ============

@Entity('anime_update_history')
@Index(['anime_id'])
@Index(['updated_at'])
export class AnimeUpdateHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anime_id: number;

  @Column({ type: 'json' })
  changes: any; // What fields were changed

  @Column({
    type: 'enum',
    enum: ['new_episode', 'metadata_update', 'status_change', 'links_update'],
  })
  change_type: string;

  @Column({ type: 'text', nullable: true })
  source_trigger: string; // What triggered the update

  @CreateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Anime, (anime) => anime.update_history)
  @JoinColumn({ name: 'anime_id' })
  anime: Anime;
}

@Entity('source_health')
@Index(['source_id'])
@Index(['checked_at'])
export class SourceHealth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source_id: number;

  @Column({ type: 'boolean' })
  is_accessible: boolean;

  @Column({ type: 'int', nullable: true })
  response_time_ms: number;

  @Column({ type: 'int', nullable: true })
  http_status_code: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'int', default: 0 })
  success_rate_24h: number; // Percentage

  @Column({ type: 'timestamp' })
  checked_at: Date;

  @ManyToOne(() => Source)
  @JoinColumn({ name: 'source_id' })
  source: Source;
}

// ============ CACHING & PERFORMANCE ============

@Entity('cache_entries')
@Index(['cache_key'], { unique: true })
@Index(['expires_at'])
@Index(['created_at'])
export class CacheEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  cache_key: string;

  @Column({ type: 'longtext' })
  cache_value: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'int', default: 0 })
  hit_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// ============ QUEUE MANAGEMENT ============

@Entity('queue_jobs')
@Index(['queue_name'])
@Index(['status'])
@Index(['scheduled_at'])
export class QueueJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  queue_name: string; // crawler, link_checker, etc.

  @Column({ type: 'text' })
  job_data: string; // JSON serialized job data

  @Column({
    type: 'enum',
    enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
    default: 'waiting',
  })
  status: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  max_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
