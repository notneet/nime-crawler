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
import { Selector } from './selector.entity';

@Entity('selector_fallbacks')
@Unique(['primary_selector_id', 'fallback_order'])
@Index(['primary_selector_id', 'is_active'])
export class SelectorFallback {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  primary_selector_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  fallback_selector_id: bigint;

  @Column({ type: 'smallint' })
  fallback_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Selector, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'primary_selector_id' })
  primary_selector: Selector;

  @ManyToOne(() => Selector, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fallback_selector_id' })
  fallback_selector: Selector;
}
