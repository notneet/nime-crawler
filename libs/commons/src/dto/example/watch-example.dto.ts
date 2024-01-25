import { ApiProperty } from '@nestjs/swagger';
import { PageDto } from 'apps/api/src/dtos/pagination.dto';
import { WatchDto } from '../watch.dto';

export class ExampleWatchDtoResponse extends PageDto<WatchDto> {
  @ApiProperty({ type: WatchDto, isArray: true })
  data: WatchDto;
}
