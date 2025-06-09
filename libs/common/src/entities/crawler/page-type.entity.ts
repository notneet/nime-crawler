import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { PageTypeName } from '../../enums/crawler.enums';

@Entity('page_types')
@Index(['type_name'], { unique: true })
export class PageType {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({
    type: 'enum',
    enum: PageTypeName,
  })
  type_name: PageTypeName;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Note: Relationships will be added when other entities are created
  // to avoid circular dependencies during initial creation
}
