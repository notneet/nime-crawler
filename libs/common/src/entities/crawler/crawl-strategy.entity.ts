import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ScrollBehavior } from '../../enums/crawler.enums';
import { JsonObject } from '../../types/crawler.types';
import { Source } from '../core/source.entity';
import { PageType } from './page-type.entity';

@Entity('crawl_strategies')
@Unique(['source_id', 'page_type_id'])
@Index(['source_id', 'is_active'])
export class CrawlStrategy {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  page_type_id: bigint;

  @Column({ length: 50 })
  strategy_name: string;

  @Column({ default: false })
  use_browser: boolean;

  @Column({ default: false })
  javascript_enabled: boolean;

  @Column({ length: 255, nullable: true })
  wait_for_selector?: string;

  @Column({ default: 10000 })
  wait_timeout: number;

  @Column({
    type: 'enum',
    enum: ScrollBehavior,
    default: ScrollBehavior.NONE,
  })
  scroll_behavior: ScrollBehavior;

  @Column({ default: 1000 })
  request_delay_min: number;

  @Column({ default: 3000 })
  request_delay_max: number;

  @Column({ default: 3 })
  max_retries: number;

  @Column({ type: 'json', nullable: true })
  configuration?: JsonObject;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @ManyToOne(() => PageType)
  @JoinColumn({ name: 'page_type_id' })
  page_type: PageType;
}
