import { AllowedUserRoles } from '@libs/commons/decorators/allowed-role.decorator';
import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { ExampleStreamDtoResponse } from '@libs/commons/dto/example/stream-example.dto';
import { StreamDto } from '@libs/commons/dto/stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import { TypedRoute } from '@nestia/core';
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Query,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { isEmpty } from 'class-validator';
import { PublicEndpoint } from '../auth/decorators/public-endpoint.decorator';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { StreamService } from './stream.service';

@ApiTags('Streams')
@Controller({
  version: '1',
  path: 'streams',
})
// @Serialize(StreamDto)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @ApiExcludeEndpoint()
  @AllowedUserRoles(['admin'])
  @TypedRoute.Post(':media_id')
  create(
    @Param('media_id') mediaId: string,
    @Body() createStreamDto: CreateStreamDto,
  ) {
    return this.streamService.create(createStreamDto, mediaId);
  }

  @ApiOkResponse({ type: ExampleStreamDtoResponse })
  @PublicEndpoint()
  @TypedRoute.Get()
  findAll(
    @Query('media_id') mediaId: string,
    @Query() pageOptDto: PageOptionsDto,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findAll(mediaId, pageOptDto);
  }

  @ApiOkResponse({ type: StreamDto })
  @PublicEndpoint()
  @TypedRoute.Get(':objectId')
  findOne(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findByObjectId(mediaId, objectId);
  }

  @ApiOkResponse({ type: StreamDto })
  @PublicEndpoint()
  @TypedRoute.Get('url/:url_stream')
  findByUrl(
    @Query('media_id') mediaId: string,
    @Param('url_stream') urlStream: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findByUrl(mediaId, urlStream);
  }

  @ApiExcludeEndpoint()
  @AllowedUserRoles(['admin'])
  @TypedRoute.Patch(':objectId')
  update(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
    @Body() updateStreamDto: UpdateStreamDto,
  ) {
    return this.streamService.update(mediaId, objectId, updateStreamDto);
  }

  @ApiExcludeEndpoint()
  @AllowedUserRoles(['admin'])
  @TypedRoute.Delete(':objectId')
  remove(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    return this.streamService.remove(mediaId, objectId);
  }

  private handleMediaIdNotDefined(mediaId?: string) {
    if (isEmpty(mediaId))
      throw new BadRequestException(
        `Query param "media_id" of media must be present`,
      );
  }
}
