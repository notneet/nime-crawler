import { ApiProperty } from '@nestjs/swagger';
import { PageDto } from 'apps/api/src/dtos/pagination.dto';
import { StreamDto } from '../stream.dto';

export class ExampleStreamDtoResponse extends PageDto<StreamDto> {
  @ApiProperty({ type: StreamDto, isArray: true })
  data: StreamDto;
}
