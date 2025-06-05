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

@Entity('anime_update_history')
@Index(['anime_id'])
@Index(['updated_at'])
export class AnimeUpdateHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  anime_id: number;

  @Column({ type: 'json' })
  changes: any; // What fields were changed

  @Column({
    type: 'enum',
    enum: ['new_episode', 'metadata_update', 'status_change', 'links_update'],
  })
  change_type: string;

  @Column({ type: 'text', nullable: true })
  source_trigger: string; // What triggered the update

  @CreateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Anime, anime => anime.update_history)
  @JoinColumn({ name: 'anime_id' })
  anime: Anime;
}
