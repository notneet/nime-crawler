import { Expose } from 'class-transformer';

export class PatternPostDetailDto {
  type?: 'post-detail';

  @Expose()
  id: number;

  @Expose()
  media_id: number;

  @Expose()
  pattern: string;

  @Expose()
  n_status: number;

  @Expose()
  pagination_pattern: string;
}
