import { ApiProperty } from '@nestjs/swagger';
import { PageDto } from 'apps/api/src/dtos/pagination.dto';
import { MediaDto } from '../media.dto';

export class ExampleMediaResponse extends PageDto<MediaDto> {
  @ApiProperty({ type: MediaDto, isArray: true })
  data: MediaDto;
}
