import { Expose } from 'class-transformer';

export class MediaDto {
  @Expose()
  name: string;

  @Expose()
  url: string;
}
