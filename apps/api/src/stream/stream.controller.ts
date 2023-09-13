import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

  @Post(':media_id')
  create(
    @Param('media_id') mediaId: string,
    @Body() createStreamDto: CreateStreamDto,
  ) {
    return this.streamService.create(createStreamDto, mediaId);
  }

  @Get()
  findAll(
    @Query('media_id') mediaId: string,
    @Query() pageOptDto: PageOptionsDto,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findAll(mediaId, pageOptDto);
  }

  @Get(':objectId')
  findOne(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findByObjectId(mediaId, objectId);
  }

  @Get('url/:urlStream')
  findByUrl(
    @Query('media_id') mediaId: string,
    @Param('urlStream') urlStream: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.streamService.findByUrl(mediaId, urlStream);
  }

  @Patch(':objectId')
  update(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
    @Body() updateStreamDto: UpdateStreamDto,
  ) {
    return this.streamService.update(mediaId, objectId, updateStreamDto);
  }

  @Delete(':objectId')
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
