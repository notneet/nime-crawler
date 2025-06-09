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
import { Selector } from './selector.entity';

@Entity('page_selectors')
@Unique(['source_id', 'page_type_id', 'field_name'])
@Index(['source_id', 'page_type_id', 'is_active'])
export class PageSelector {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  source_id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  page_type_id: bigint;

  @Column({ length: 100 })
  field_name: string;

  @Column({ type: 'bigint', unsigned: true })
  selector_id: bigint;

  @Column({ default: false })
  is_required: boolean;

  @Column({ type: 'json', nullable: true })
  extraction_rules?: JsonObject;

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

  @ManyToOne(() => Selector)
  @JoinColumn({ name: 'selector_id' })
  selector: Selector;
}
