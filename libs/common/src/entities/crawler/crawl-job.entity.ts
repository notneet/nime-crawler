import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Source } from '../core/source.entity';
import { CrawlLog } from './crawl-log.entity';
import { CrawlJobType, CrawlJobStatus } from '../../types/crawl-job.types';

@Entity('crawl_jobs')
@Index(['source_id'])
@Index(['status'])
@Index(['job_type'])
@Index(['scheduled_at'])
export class CrawlJob {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ length: 36, unique: true })
  job_id: string;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({
    type: 'enum',
    enum: CrawlJobType,
  })
  job_type: CrawlJobType;

  @Column({
    type: 'enum',
    enum: CrawlJobStatus,
    default: CrawlJobStatus.PENDING,
  })
  status: CrawlJobStatus;

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

  @ManyToOne(() => Source, source => source.crawl_jobs)
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @OneToMany(() => CrawlLog, log => log.job)
  logs: CrawlLog[];
}
