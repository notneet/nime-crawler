import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import { TypedRoute } from '@nestia/core';
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Query,
} from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { StreamService } from './stream.service';

@Controller({
  version: '1',
  path: 'streams',
})
// @Serialize(StreamDto)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @TypedRoute.Post(':media_id')
  create(
    @Param('media_id') mediaId: string,
    @Body() createStreamDto: CreateStreamDto,
  ) {
    return this.streamService.create(createStreamDto, mediaId);
  }

  @TypedRoute.Get()
  findAll(
    @Query('media_id') mediaId: string,
    @Query() pageOptDto: PageOptionsDto,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findAll(mediaId, pageOptDto);
  }

  @TypedRoute.Get(':objectId')
  findOne(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findByObjectId(mediaId, objectId);
  }

  @TypedRoute.Get('url/:urlStream')
  findByUrl(
    @Query('media_id') mediaId: string,
    @Param('urlStream') urlStream: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findByUrl(mediaId, urlStream);
  }

  @TypedRoute.Patch(':objectId')
  update(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
    @Body() updateStreamDto: UpdateStreamDto,
  ) {
    return this.streamService.update(mediaId, objectId, updateStreamDto);
  }

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
