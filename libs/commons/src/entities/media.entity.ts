import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'media' })
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  url: string;
}
