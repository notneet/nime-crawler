import { Expose } from 'class-transformer';

export class PostPatternDto {
  @Expose()
  id: number;

  @Expose()
  media_id: number;

  @Expose()
  pattern: string;

  @Expose()
  pagination_pattern: string;

  @Expose()
  n_status: number;
}
