import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CrawlJob } from './crawl-job.entity';

@Entity('crawl_logs')
@Index(['job_id'])
@Index(['level'])
@Index(['created_at'])
export class CrawlLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint' })
  job_id: bigint;

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

  @ManyToOne(() => CrawlJob, job => job.logs)
  @JoinColumn({ name: 'job_id' })
  job: CrawlJob;
}
