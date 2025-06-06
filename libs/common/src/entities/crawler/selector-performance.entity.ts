import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Source } from '../core/source.entity';
import { PageType } from './page-type.entity';
import { Selector } from './selector.entity';

@Entity('selector_performance')
@Unique(['selector_id', 'source_id', 'page_type_id', 'test_date'])
@Index(['test_date'])
@Index(['success_rate'])
export class SelectorPerformance {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  selector_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  page_type_id: bigint;

  @Column({ type: 'date' })
  test_date: Date;

  @Column({ default: 0 })
  total_attempts: number;

  @Column({ default: 0 })
  successful_extractions: number;

  @Column({ default: 0 })
  failed_extractions: number;

  @Column({ default: 0 })
  average_response_time_ms: number;

  @Generated()
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    asExpression: `CASE WHEN total_attempts > 0 THEN (successful_extractions / total_attempts) * 100 ELSE 0 END`,
  })
  success_rate: number;

  // Relationships
  @ManyToOne(() => Selector, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'selector_id' })
  selector: Selector;

  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @ManyToOne(() => PageType)
  @JoinColumn({ name: 'page_type_id' })
  page_type: PageType;
}
