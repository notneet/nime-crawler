import { Expose } from 'class-transformer';

export class WatchDto {
  @Expose()
  id: number;

  @Expose()
  object_id: string;

  @Expose()
  url: string;

  @Expose()
  title: string;

  @Expose()
  title_jp: string;

  @Expose()
  title_en: string;

  @Expose()
  type: string;

  @Expose()
  score: number;

  @Expose()
  status: string;

  @Expose()
  duration: number;

  @Expose()
  total_episode: number;

  @Expose()
  published: Date;

  @Expose()
  published_ts: Date;

  @Expose()
  season: string;

  @Expose()
  genres: string;

  @Expose()
  producers: string;

  @Expose()
  description: string;

  @Expose()
  cover_url: string;

  @Expose()
  media_id: number;
}
