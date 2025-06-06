import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ErrorType } from '../../enums/crawler.enums';
import { Source } from '../core/source.entity';

@Entity('source_health')
@Index(['source_id', 'checked_at'])
@Index(['is_accessible', 'checked_at'])
export class SourceHealth {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  checked_at: Date;

  @Column({ type: 'boolean' })
  is_accessible: boolean;

  @Column({ nullable: true })
  response_time_ms?: number;

  @Column({ nullable: true })
  http_status_code?: number;

  @Column({
    type: 'enum',
    enum: ErrorType,
    nullable: true,
  })
  error_type?: ErrorType;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ default: false })
  page_structure_changed: boolean;

  @Column({ default: 0 })
  selectors_working_count: number;

  @Column({ default: 0 })
  selectors_failing_count: number;

  // Relationships
  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;
}
