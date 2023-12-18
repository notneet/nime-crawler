import { CreateMediaDto } from '@libs/commons/dto/create/create-media.dto';
import { MediaDto } from '@libs/commons/dto/media.dto';
import { UpdateMediaDto } from '@libs/commons/dto/update/update-media.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import { TypedRoute } from '@nestia/core';
import { Body, Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { MediaService } from './media.service';

@Controller({
  version: '1',
  path: 'medias',
})
@Serialize(MediaDto)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @TypedRoute.Post()
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @TypedRoute.Get()
  findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.mediaService.findAll(pageOptDto);
  }

  @TypedRoute.Get(':url')
  findUrl(@Param('url') urlMedia: string) {
    return this.mediaService.findByUrl(urlMedia);
  }

  @TypedRoute.Patch(':url')
  update(
    @Param('url') urlMedia: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(urlMedia, updateMediaDto);
  }

  @TypedRoute.Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
