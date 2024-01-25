import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'anime_source' })
export class AnimeSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  media_id: number;

  @Column({ unique: true, length: 100 })
  url: string;

  @Column({ type: 'smallint' })
  interval: number;

  @Column({ type: 'tinyint' })
  n_status: number;

  @Column({ unsigned: true })
  timeout: number;

  @Column()
  max_itterate_post: number;

  @Column()
  max_itterate_detail: number;

  @Column({ length: 5 })
  lang_code: string;

  @Column({ length: 5 })
  country_code: string;

  @Column({ length: 10 })
  engine: string;

  @Column({ type: 'timestamp' })
  last_modified: Date;

  @Column({ type: 'timestamp' })
  last_crawled: Date;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;
}
