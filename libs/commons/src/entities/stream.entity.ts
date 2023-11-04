import { createHash } from 'crypto';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { urlNormalize } from '../helper/url-normalize';

@Entity({ name: 'stream_model' })
export class Stream {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128 })
  watch_id: string;

  @Column({ length: 128 })
  object_id: string;

  @Column({ length: 128 })
  author: string;

  @Column({ type: 'datetime' })
  published: Date;

  @Column({ type: 'timestamp' })
  published_ts: Date;

  @Column()
  num_episode: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 512 })
  url: string;

  @Column({ length: 100 })
  quality: string;

  @Column({ length: 100 })
  file_size: string;

  @Column()
  media_id: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  changeUrlToObjectID() {
    this.object_id = createHash('md5')
      .update(urlNormalize(this.url))
      .digest('hex');
  }
}
