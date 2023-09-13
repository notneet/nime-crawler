import { CreateWatchDto } from '@libs/commons/dto/create/create-watch.dto';
import { UpdateWatchDto } from '@libs/commons/dto/update/update-watch.dto';
import { WatchDto } from '@libs/commons/dto/watch.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
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
import { WatchService } from './watch.service';

@Controller({
  version: '1',
  path: 'watches',
})
@Serialize(WatchDto)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post(':media_id')
  create(
    @Param('media_id') mediaId: string,
    @Body() createWatchDto: CreateWatchDto,
  ) {
    return this.watchService.create(createWatchDto, mediaId);
  }

  @Get()
  findAll(@Query('media_id') mediaId: string) {
    this.handleMediaIdNotDefined(mediaId);

    return this.watchService.findAll(mediaId);
  }

  @Get(':objectId')
  findOne(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.watchService.findByObjectId(mediaId, objectId);
  }

  @Get('url/:urlWatch')
  findByUrl(
    @Query('media_id') mediaId: string,
    @Param('urlWatch') urlWatch: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.watchService.findByUrl(mediaId, urlWatch);
  }

  @Patch(':objectId')
  update(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
    @Body() updateWatchDto: UpdateWatchDto,
  ) {
    return this.watchService.update(mediaId, objectId, updateWatchDto);
  }

  @Delete(':objectId')
  remove(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    return this.watchService.remove(mediaId, objectId);
  }

  private handleMediaIdNotDefined(mediaId?: string) {
    if (isEmpty(mediaId))
      throw new BadRequestException(
        `Query param "media_id" of media must be present`,
      );
  }
}
