import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MediaDto {
  id: number;

  @ApiProperty({ example: 'Otakudesu' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'otakudesu.cam' })
  @Expose()
  url: string;

  @ApiPropertyOptional({ example: 'otakudesu.lol' })
  @Expose()
  url_old: string | null;
}
