import { Type } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  FieldPipeOptionsPattern,
  FieldPipePattern,
} from './field-field-pattern';

export enum ExistAnimePostKeys {
  CONTAINER = 'CONTAINER',
  LINK_PATTERN = 'LINK_PATTERN',
}

export class AnimeFieldMeta {
  alternativePattern?: string[];
  multiline?: boolean;
  pagePattern?: {
    url?: string;
    text?: string;
  };
}

export class AnimePostField extends FieldPipePattern {
  key: ExistAnimePostKeys;

  pattern: string;

  result_type: string;

  @Type(() => FieldPipeOptionsPattern)
  options: FieldPipeOptionsPattern;

  @Type(() => AnimeFieldMeta)
  meta?: AnimeFieldMeta;
}

@Entity({ name: 'post_pattern' })
export class PostPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  media_id: number;

  @Column({ type: 'text' })
  pattern: string;

  @Column({ type: 'text' })
  pagination_pattern: string;

  @Column({ type: 'tinyint', default: 0 })
  n_status: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  transformArrayToJSOnStr() {
    this.pattern = JSON.stringify(this.pattern);
    this.pagination_pattern = JSON.stringify(this.pagination_pattern);
  }
}
