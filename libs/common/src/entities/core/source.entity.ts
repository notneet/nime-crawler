import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CrawlJob } from '../crawler/crawl-job.entity';
import { Anime } from './anime.entity';

@Entity('sources')
@Index(['is_active', 'priority'], { unique: true })
@Index(['slug'], { unique: true })
export class Source {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  slug: string; // samehadaku, otakudesu, huntersekai, kusonime

  @Column('text')
  base_url: string;

  // Legacy fields for backward compatibility
  @Column({ type: 'json', nullable: true })
  selectors: any; // CSS selectors for scraping (legacy)

  @Column({ type: 'json', nullable: true })
  headers: any; // Custom headers for requests (legacy)

  // Enhanced crawler configuration
  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'smallint', default: 1 })
  priority: number;

  @Column({ default: 5000 })
  delay_ms: number;

  @Column({ default: 3 })
  max_concurrent: number;

  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  @Column({ default: 30 })
  timeout_seconds: number;

  @Column({ type: 'timestamp', nullable: true })
  last_crawled_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => Anime, anime => anime.source)
  animes: Anime[];

  @OneToMany(() => CrawlJob, job => job.source)
  crawl_jobs: CrawlJob[];

  // Note: New crawler relationships will be added when relationship files are updated
}
