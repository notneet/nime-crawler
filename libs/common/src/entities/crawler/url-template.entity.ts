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
import { JsonObject } from '../../types/crawler.types';
import { Source } from '../core/source.entity';
import { PageType } from './page-type.entity';

@Entity('url_templates')
@Unique(['source_id', 'page_type_id', 'template_name'])
@Index(['source_id', 'page_type_id', 'is_active'])
export class UrlTemplate {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  page_type_id: bigint;

  @Column({ length: 100 })
  template_name: string;

  @Column({ type: 'text' })
  url_template: string;

  @Column({ type: 'json', nullable: true })
  parameter_schema?: JsonObject;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'smallint', default: 1 })
  priority: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Source, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @ManyToOne(() => PageType)
  @JoinColumn({ name: 'page_type_id' })
  page_type: PageType;

  // Note: UrlHistory relationship will be added after UrlHistory entity is created
}
