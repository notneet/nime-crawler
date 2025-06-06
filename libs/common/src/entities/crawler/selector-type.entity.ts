import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { SelectorTypeName } from '../../enums/crawler.enums';

@Entity('selector_types')
@Index(['type_name'])
export class SelectorType {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({
    type: 'enum',
    enum: SelectorTypeName,
    unique: true,
  })
  type_name: SelectorTypeName;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Note: Relationships will be added when Selector entity is created
}
