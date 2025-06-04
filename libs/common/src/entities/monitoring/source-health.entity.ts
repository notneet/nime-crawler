import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Source } from '../core/source.entity';

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
