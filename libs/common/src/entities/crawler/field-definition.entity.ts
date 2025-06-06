import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DataType } from '../../enums/crawler.enums';
import { JsonObject } from '../../types/crawler.types';

@Entity('field_definitions')
@Index(['field_name'])
export class FieldDefinition {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: bigint;

  @Column({ length: 100, unique: true })
  field_name: string;

  @Column({
    type: 'enum',
    enum: DataType,
  })
  data_type: DataType;

  @Column({ type: 'json', nullable: true })
  validation_rules?: JsonObject;

  @Column({ type: 'json', nullable: true })
  transformation_rules?: JsonObject;

  @Column({ default: false })
  is_required: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
