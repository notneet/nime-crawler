import { Expose, Type } from 'class-transformer';

export class StreamDto {
  @Expose()
  @Type(() => Number)
  id: number;

  @Expose()
  watch_id: string;

  @Expose()
  media_id: number;

  @Expose()
  object_id: string;

  @Expose()
  author: string | null;

  @Expose()
  published: Date | null;

  @Expose()
  @Type(() => Number)
  published_ts: number | null;

  @Expose()
  name: string | null;

  @Expose()
  url: string | null;

  @Expose()
  quality: string | null;

  @Expose()
  file_size: string | null;

  @Expose()
  @Type(() => Number)
  num_episode: number;

  @Expose()
  type: string;
}
