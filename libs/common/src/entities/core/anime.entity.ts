import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnimeUpdateHistory } from '../monitoring/anime-update-history.entity';
import { Episode } from './episode.entity';
import { Genre } from './genre.entity';
import { Source } from './source.entity';

@Entity('anime')
@Index(['slug'], { unique: true })
@Index(['source_id', 'source_anime_id'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['release_year'])
export class Anime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  alternative_title: string;

  @Column({ type: 'text', nullable: true })
  synopsis: string;

  @Column({ type: 'text', nullable: true })
  poster_url: string;

  @Column({ type: 'text', nullable: true })
  banner_url: string;

  @Column({
    type: 'enum',
    enum: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'],
    default: 'TV',
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['Ongoing', 'Completed', 'Upcoming', 'Hiatus'],
    default: 'Ongoing',
  })
  status: string;

  @Column({ type: 'smallint', nullable: true })
  total_episodes: number;

  @Column({ type: 'smallint', nullable: true })
  release_year: number;

  @Column({
    type: 'enum',
    enum: ['Spring', 'Summer', 'Fall', 'Winter'],
    nullable: true,
  })
  season: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  download_count: number;

  // Source reference
  @Column()
  source_id: number;

  @Column({ length: 100 })
  source_anime_id: string; // Original ID from source site

  @Column({ type: 'text' })
  source_url: string;

  @Column({ type: 'timestamp', nullable: true })
  last_updated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Source, (source) => source.animes)
  @JoinColumn({ name: 'source_id' })
  source: Source;

  @OneToMany(() => Episode, (episode) => episode.anime)
  episodes: Episode[];

  @ManyToMany(() => Genre, (genre) => genre.animes)
  @JoinTable({
    name: 'anime_genres',
    joinColumn: { name: 'anime_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @OneToMany(() => AnimeUpdateHistory, (history) => history.anime)
  update_history: AnimeUpdateHistory[];
}
