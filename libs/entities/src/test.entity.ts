import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  synchronize: false,
})
export class Test {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ length: 100 })
  name: string;
}
