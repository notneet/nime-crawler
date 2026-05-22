import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('anime')
@Index('uq_anime_source_url', ['source', 'url'], { unique: true })
export class Anime {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  source!: string;

  @Column()
  url!: string;

  @Column()
  slug!: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  titleJP?: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  score?: string;

  @Column({ nullable: true })
  duration?: string;

  @Column({ nullable: true })
  totalEpisodes?: string;

  @Column({ nullable: true })
  studio?: string;

  @Column({ nullable: true })
  producers?: string;

  @Column({ nullable: true })
  releaseDate?: string;

  @Column({ type: 'text', nullable: true })
  synopsis?: string;

  @Column({ type: 'simple-json', nullable: true })
  raw?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
