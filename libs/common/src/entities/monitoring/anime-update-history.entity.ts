import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Anime } from '../core/anime.entity';
import { AnimeUpdateChangeType } from '../../types/anime-update.types';

@Entity('anime_update_history')
@Index(['anime_id'])
@Index(['updated_at'])
export class AnimeUpdateHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true })
  anime_id: bigint;

  @Column({ type: 'json' })
  changes: any; // What fields were changed

  @Column({
    type: 'enum',
    enum: AnimeUpdateChangeType,
  })
  change_type: AnimeUpdateChangeType;

  @Column({ type: 'text', nullable: true })
  source_trigger: string; // What triggered the update

  @CreateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Anime, anime => anime.update_history)
  @JoinColumn({ name: 'anime_id' })
  anime: Anime;
}
