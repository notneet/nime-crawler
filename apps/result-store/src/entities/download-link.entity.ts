import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('download_link')
@Index('uq_download', ['url', 'ownerUrl', 'kind'], { unique: true })
export class DownloadLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  source!: string;

  @Column()
  ownerUrl!: string;

  @Column()
  kind!: string;

  @Column({ nullable: true })
  quality?: string;

  @Column({ nullable: true })
  host?: string;

  @Column({ nullable: true })
  size?: string;

  @Column()
  url!: string;
}
