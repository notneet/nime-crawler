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
