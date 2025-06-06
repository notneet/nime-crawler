import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Anime } from './anime.entity';
import { DownloadLink } from './download-link.entity';

@Entity('episodes')
@Index(['anime_id', 'episode_number'], { unique: true })
@Index(['anime_id'])
@Index(['source_episode_id'])
export class Episode {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint' })
  anime_id: bigint;

  @Column({ type: 'smallint' })
  episode_number: number;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ length: 100 })
  source_episode_id: string;

  @Column({ type: 'text' })
  source_url: string;

  @Column({ type: 'text', nullable: true })
  thumbnail_url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number;

  @Column({ type: 'date', nullable: true })
  air_date: Date;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  download_count: number;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_checked_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Anime, anime => anime.episodes)
  @JoinColumn({ name: 'anime_id' })
  anime: Anime;

  @OneToMany(() => DownloadLink, link => link.episode)
  download_links: DownloadLink[];
}
