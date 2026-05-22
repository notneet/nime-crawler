import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('genre')
@Index('uq_genre_slug', ['slug'], { unique: true })
export class Genre {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  slug!: string;
}
