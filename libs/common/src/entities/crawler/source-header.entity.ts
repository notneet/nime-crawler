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
import { Source } from '../core/source.entity';

@Entity('source_headers')
@Unique(['source_id', 'header_name'])
@Index(['source_id', 'is_active'])
export class SourceHeader {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ length: 100 })
  header_name: string;

  @Column({ type: 'text' })
  header_value: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;
}
