import { Expose } from 'class-transformer';

export class AnimeSourceDto {
  @Expose()
  id: number;

  @Expose()
  media_id: number;

  @Expose()
  url: string;

  @Expose()
  interval: number;

  @Expose()
  n_status: number;

  @Expose()
  timeout: number;

  @Expose()
  max_itterate_post: number;

  @Expose()
  max_itterate_detail: number;

  @Expose()
  lang_code: string;

  @Expose()
  country_code: string;

  @Expose()
  last_modified: Date;

  @Expose()
  last_crawled: Date;
}
