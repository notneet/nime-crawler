import { Expose } from 'class-transformer';

export class StreamDto {
  @Expose()
  watch_id: string;

  @Expose()
  object_id: string;

  @Expose()
  author: string;

  @Expose()
  published: Date;

  @Expose()
  published_ts: Date;

  @Expose()
  name: string;

  @Expose()
  url: string;

  @Expose()
  quality: string;

  @Expose()
  file_size: string;

  @Expose()
  media_id: number;
}
