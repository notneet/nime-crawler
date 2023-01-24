import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'post_detail_pattern' })
export class PostDetailPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  media_id: number;

  @Column({ type: 'text' })
  pattern: string;

  @Column({ type: 'tinyint', default: 0 })
  n_status: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column({ type: 'text' })
  episode_pattern: string;

  @BeforeInsert()
  @BeforeUpdate()
  transformArrayToJSOnStr() {
    if (typeof this.pattern === 'object') {
      this.pattern = JSON.stringify(this.pattern);
    }
    if (typeof this.episode_pattern === 'object') {
      this.episode_pattern = JSON.stringify(this.episode_pattern);
    }
  }
}
