import { createHash } from 'crypto';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { urlNormalize } from '../helper/url-normalize';
import { Stream } from './stream.entity';

@Entity({ name: 'watch_model' })
export class Watch {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 128 })
  object_id: string;

  @Column({ length: 128, unique: true })
  url: string;

  @Column({ length: 128 })
  title: string;

  @Column({ length: 128 })
  title_jp: string;

  @Column({ length: 128 })
  title_en: string;

  @Column({ length: 10 })
  type: string;

  @Column({ type: 'decimal', default: 0.0 })
  score: number;

  @Column({ length: 12 })
  status: string;

  @Column()
  duration: number;

  @Column({ default: 0 })
  total_episode: number;

  @Column({ type: 'datetime', default: '1970-01-01 00:00:00' })
  published: Date;

  @Column({ type: 'timestamp', default: null })
  published_ts: number;

  @Column({ length: 100, nullable: true })
  season: string;

  @Column({ length: 128 })
  genres: string;

  @Column({ length: 128 })
  producers: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at?: Date;

  @Column({ length: 100 })
  cover_url: string;

  @Column()
  media_id: number;

  @BeforeInsert()
  @BeforeUpdate()
  changeUrlToObjectID() {
    this.object_id = createHash('md5')
      .update(urlNormalize(this.url))
      .digest('hex');
  }

  @OneToMany(() => Stream, (stream) => stream.watch)
  @JoinColumn({ name: 'object_id' })
  streams: Stream[];
}
