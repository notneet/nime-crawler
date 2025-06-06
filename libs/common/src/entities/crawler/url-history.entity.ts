import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CrawlStatus } from '../../enums/crawler.enums';
import { JsonObject } from '../../types/crawler.types';
import { Source } from '../core/source.entity';
import { PageType } from './page-type.entity';
import { UrlTemplate } from './url-template.entity';

@Entity('url_history')
@Index(['source_id', 'page_type_id', 'crawl_status'])
@Index(['last_crawled_at'])
export class UrlHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  page_type_id: bigint;

  @Column({ type: 'text' })
  generated_url: string;

  @Column({ type: 'json', nullable: true })
  parameters?: JsonObject;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  template_id?: bigint;

  @Column({ type: 'timestamp', nullable: true })
  last_crawled_at?: Date;

  @Column({
    type: 'enum',
    enum: CrawlStatus,
    default: CrawlStatus.PENDING,
  })
  crawl_status: CrawlStatus;

  @Column({ nullable: true })
  response_status?: number;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @ManyToOne(() => PageType)
  @JoinColumn({ name: 'page_type_id' })
  page_type: PageType;

  @ManyToOne(() => UrlTemplate, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template?: UrlTemplate;
}
