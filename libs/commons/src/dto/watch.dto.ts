import { Expose, Type } from 'class-transformer';

export class WatchDto {
  @Expose()
  id: number;

  @Expose()
  object_id: string | null;

  @Expose()
  media_id: number;

  @Expose()
  url: string;

  @Expose()
  title: string | null;

  @Expose()
  title_jp: string | null;

  @Expose()
  title_en: string | null;

  @Expose()
  type: string | null;

  @Expose()
  @Type(() => Number)
  score: number | null;

  @Expose()
  status: string | null;

  @Expose()
  duration: number | null;

  @Expose()
  total_episode: number | null;

  @Expose()
  published: Date | null;

  @Expose()
  published_ts: Date | null;

  @Expose()
  season: string | null;

  @Expose()
  genres: string | null;

  @Expose()
  producers: string | null;

  @Expose()
  description: string | null;

  @Expose()
  cover_url: string | null;
}
