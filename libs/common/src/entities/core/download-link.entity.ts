import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Episode } from './episode.entity';

@Entity('download_links')
@Index(['episode_id'])
@Index(['provider'])
@Index(['quality'])
export class DownloadLink {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint' })
  episode_id: bigint;

  @Column({ length: 100 })
  provider: string; // Google Drive, Mega, MediaFire, etc.

  @Column({ type: 'text' })
  url: string;

  @Column({ length: 20 })
  quality: string; // 360p, 480p, 720p, 1080p

  @Column({ length: 20, nullable: true })
  format: string; // MP4, MKV, etc.

  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_checked_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Episode, episode => episode.download_links)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}
