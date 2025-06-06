import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JsonObject } from '../../types/crawler.types';
import { Source } from '../core/source.entity';
import { PageType } from './page-type.entity';

@Entity('url_patterns')
@Index(['source_id', 'page_type_id', 'is_active'])
export class UrlPattern {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  page_type_id: bigint;

  @Column({ length: 100 })
  pattern_name: string;

  @Column({ type: 'text' })
  regex_pattern: string;

  @Column({ type: 'json', nullable: true })
  parameter_mapping?: JsonObject;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'smallint', default: 1 })
  priority: number;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @ManyToOne(() => PageType)
  @JoinColumn({ name: 'page_type_id' })
  page_type: PageType;
}
