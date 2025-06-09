import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QueueJobStatus } from '../../types/queue-job.types';

@Entity('queue_jobs')
@Index(['queue_name'])
@Index(['status'])
@Index(['scheduled_at'])
export class QueueJob {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ length: 100 })
  queue_name: string; // crawler, link_checker, etc.

  @Column({ type: 'text' })
  job_data: string; // JSON serialized job data

  @Column({
    type: 'enum',
    enum: QueueJobStatus,
    default: QueueJobStatus.WAITING,
  })
  status: QueueJobStatus;

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
