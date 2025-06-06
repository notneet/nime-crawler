import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { SelectorType } from './selector-type.entity';

@Entity('selectors')
@Unique(['name', 'version'])
@Index(['is_active', 'selector_type_id'])
@Index(['success_rate'])
@Index(['name'])
export class Selector {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'bigint', unsigned: true })
  selector_type_id: bigint;

  @Column('text')
  selector_value: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 1 })
  version: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  success_rate: number;

  @Column({ type: 'timestamp', nullable: true })
  last_tested_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => SelectorType)
  @JoinColumn({ name: 'selector_type_id' })
  selector_type: SelectorType;

  // Note: Other relationships will be added when dependent entities are created
}
