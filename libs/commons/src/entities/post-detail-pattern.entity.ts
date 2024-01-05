import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FieldPipePattern } from './field-field-pattern';

export enum ExistAnimeDetailKeys {
  POST_CONTAINER = 'POST_CONTAINER',
  POST_TITLE = 'POST_TITLE',
  POST_TITLE_JP = 'POST_TITLE_JP',
  POST_TITLE_EN = 'POST_TITLE_EN',
  POST_TYPE = 'POST_TYPE',
  POST_SCORE = 'POST_SCORE',
  POST_STATUS = 'POST_STATUS',
  POST_DURATION = 'POST_DURATION',
  POST_TOTAL_EPISODE = 'POST_TOTAL_EPISODE',
  POST_SEASON = 'POST_SEASON',
  POST_GENRES = 'POST_GENRES',
  POST_PRODUCERS = 'POST_PRODUCERS',
  POST_DESCRIPTION = 'POST_DESCRIPTION',
  POST_COVER = 'POST_COVER',
  EPISODE_PATTERN = 'EPISODE_PATTERN',
  PUBLISHED_DATE = 'PUBLISHED_DATE',
}

export class AnimeFieldMeta {
  alternativePattern?: string[];
  multiline?: boolean;
}

export class AnimeDetailField extends FieldPipePattern {}

@Entity({ name: 'post_detail_pattern' })
export class PostDetailPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  media_id: number;

  @Column({ type: 'text' })
  pattern: string;

  @Column({ type: 'tinyint', default: 0 })
  n_status: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'text' })
  pagination_pattern: string;

  @BeforeInsert()
  @BeforeUpdate()
  transformArrayToJSOnStr() {
    if (typeof this.pattern === 'object') {
      this.pattern = JSON.stringify(this.pattern);
    }
    if (typeof this.pagination_pattern === 'object') {
      this.pagination_pattern = JSON.stringify(this.pagination_pattern);
    }
  }
}
