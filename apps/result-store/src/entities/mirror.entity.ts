import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mirror')
@Index('uq_mirror', ['episodeUrl', 'quality', 'host'], { unique: true })
export class Mirror {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  episodeUrl!: string;

  @Column()
  quality!: string;

  @Column()
  host!: string;

  @Column({ type: 'text', nullable: true })
  payload?: string;

  @Column({ type: 'text', nullable: true })
  streamUrl?: string;
}
