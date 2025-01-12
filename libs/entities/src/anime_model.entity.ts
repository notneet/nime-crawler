import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnimeLinkResultData } from './types/anime-link.interface';

@Entity({
  database: 'anime_data',
  synchronize: false,
})
export class AnimeModel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Index({ unique: true })
  @Column({ nullable: false })
  uuid: string;

  @Index({ unique: true })
  @Column()
  url: string;

  @Index()
  @Column()
  title_en: string;

  @Index()
  @Column({ nullable: true })
  title_jp: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  producers: string;

  @Column({ nullable: true })
  studios: string;

  @Column({ nullable: true })
  genres: string;

  @Column({ nullable: true })
  episode_count: number;

  @Column({ nullable: true })
  episode_duration: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'timestamp', nullable: true })
  release_date: Date;

  @Column({ nullable: true })
  batch_url: string;

  @Column({ type: 'json', nullable: true })
  download_list: AnimeLinkResultData[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
