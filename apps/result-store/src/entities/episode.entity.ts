import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('episode')
@Index('uq_episode_source_url', ['source', 'url'], { unique: true })
export class Episode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  source!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  animeUrl?: string;

  @Column({ nullable: true })
  number?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  streamUrl?: string;

  @Column({ nullable: true })
  streamFallback?: string;

  @Column({ nullable: true })
  postedBy?: string;

  @Column({ nullable: true })
  releaseInfo?: string;

  @Column({ type: 'simple-json', nullable: true })
  raw?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
