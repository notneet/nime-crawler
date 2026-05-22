import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Stage } from '@libs/commons';

@Entity('crawl_results')
@Index('uq_source_url_stage', ['source', 'url', 'stage'], { unique: true })
export class CrawlResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  source!: string;

  @Column('text')
  stage!: Stage;

  @Column()
  url!: string;

  @Column({ type: 'simple-json' })
  data!: unknown;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
