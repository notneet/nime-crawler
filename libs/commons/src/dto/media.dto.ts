import { Expose } from 'class-transformer';

export class MediaDto {
  id: number;

  @Expose()
  name: string;

  @Expose()
  url: string;

  @Expose()
  url_old: string | null;
}
