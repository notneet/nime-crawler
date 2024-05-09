import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FieldPipePattern } from './field-field-pattern';

export enum ExistAnimeEpisodeKeys {
  EPISODE_CONTAINER = 'EPISODE_CONTAINER',
  EPISODE_PROVIDER = 'EPISODE_PROVIDER',
  EPISODE_HASH = 'EPISODE_HASH',
}

export class AnimeFieldMeta {
  alternativePattern?: string[];
  multiline?: boolean;
}

export class AnimeEpisodeField extends FieldPipePattern {}

@Entity({ name: 'post_episode_pattern' })
export class PostEpisodePattern {
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

  @BeforeInsert()
  @BeforeUpdate()
  transformArrayToJSOnStr() {
    if (typeof this.pattern === 'object') {
      this.pattern = JSON.stringify(this.pattern);
    }
  }
}
