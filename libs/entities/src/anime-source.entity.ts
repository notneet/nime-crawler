import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  database: 'anime_data',
  synchronize: false,
})
export class AnimeSource {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Index()
  @Column({ type: 'bigint', unsigned: true, nullable: false })
  media_id: bigint;

  @Index({ unique: true })
  @Column({ nullable: false })
  url: string;

  @Index()
  @Column({ nullable: false })
  last_run_at: Date;

  @Index()
  @Column({ nullable: false })
  interval_minute: number;

  @Index()
  @Column({ type: 'tinyint', nullable: true, default: 0 })
  n_status: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
