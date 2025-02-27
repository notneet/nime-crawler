import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PatternData } from './types/pattern-data.type';

@Entity({
  database: 'anime_data',
  synchronize: false,
})
export class PatternIndex {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Index()
  @Column({ type: 'bigint', unsigned: true, nullable: false })
  media_id: bigint;

  @Column({ type: 'json', nullable: true })
  pattern: PatternData[];

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
