import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DownloadArchiveStatus = 'pending' | 'done' | 'failed';

@Entity('download_archive')
@Index('uq_download_archive', ['episodeId', 'qualityRank'], { unique: true })
export class DownloadArchive {
  @PrimaryGeneratedColumn() id!: number;
  @Column() episodeId!: number;
  @Column() source!: string;
  @Column() quality!: string;
  @Column() qualityRank!: number;
  @Column() sourceUrl!: string;
  @Column() s3Bucket!: string;
  @Column() s3Key!: string;
  @Column({ type: 'bigint', nullable: true }) sizeBytes?: string | null;
  @Column() status!: DownloadArchiveStatus;
  @Column({ type: 'text', nullable: true }) error?: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
