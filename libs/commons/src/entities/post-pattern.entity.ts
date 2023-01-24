import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'post_pattern' })
export class PostPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  media_id: number;

  @Column({ type: 'text' })
  pattern: string;

  @Column({ type: 'text' })
  pagination_pattern: string;

  @Column({ type: 'tinyint', default: 0 })
  n_status: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @BeforeInsert()
  @BeforeUpdate()
  transformArrayToJSOnStr() {
    this.pattern = JSON.stringify(this.pattern);
    this.pagination_pattern = JSON.stringify(this.pagination_pattern);
  }
}
