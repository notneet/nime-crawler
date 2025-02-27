import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnimeLinkResultData } from './types/anime-link.interface';

export enum AnimeEpisodeType {
  MIRROR = 'mirror',
  BATCH = 'batch',
  WATCH = 'watch',
}

@Entity({
  database: 'anime_data',
  synchronize: false,
})
export class AnimeEpisodeModel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Index()
  @Column({ type: 'bigint', unsigned: true, nullable: false })
  anime_id: bigint;

  @Index({ unique: true })
  @Column()
  uuid: string;

  @Index({ unique: true })
  @Column()
  url: string;

  @Index()
  @Column({ nullable: true })
  video_url: string;

  @Column({ type: 'json', nullable: true })
  mirrors: AnimeLinkResultData[];

  @Column({ type: 'json', nullable: true })
  download_list: AnimeLinkResultData[];

  @Column()
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @BeforeInsert()
  stringifyDownloadList() {
    this.download_list = JSON.stringify(
      this.download_list,
    ) as unknown as AnimeLinkResultData[];
  }
}
