import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Stage } from '../messaging/exchanges';
import type { StageConfig } from '../adapters/site-adapter.types';

@Entity('adapter')
@Index('uq_adapter_source', ['source'], { unique: true })
export class Adapter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  source!: string;

  @Column()
  baseUrl!: string;

  @Column({ default: true })
  enabled: boolean = true;

  @Column({ type: 'simple-json' })
  stages!: Partial<Record<Stage, StageConfig>>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
