import { CreateMediaDto } from '@libs/commons/dto/create/create-media.dto';
import { ExampleMediaResponse } from '@libs/commons/dto/example/media-example.dto';
import { MediaDto } from '@libs/commons/dto/media.dto';
import { UpdateMediaDto } from '@libs/commons/dto/update/update-media.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import { TypedRoute } from '@nestia/core';
import { Body, Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { MediaService } from './media.service';

@ApiTags('Medias')
@Controller({
  version: '1',
  path: 'medias',
})
@Serialize(MediaDto)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiExcludeEndpoint()
  @TypedRoute.Post()
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @ApiOkResponse({
    type: ExampleMediaResponse,
    description:
      'Response is wrapped by "data" object item. See example /pagination endpoint',
  })
  @TypedRoute.Get()
  findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.mediaService.findAll(pageOptDto);
  }

  @ApiOkResponse({
    type: MediaDto,
    description: 'Response is wrapped by "data" object item',
  })
  @TypedRoute.Get(':url')
  findUrl(@Param('url') urlMedia: string) {
    return this.mediaService.findByUrl(urlMedia);
  }

  @ApiExcludeEndpoint()
  @TypedRoute.Patch(':url')
  update(
    @Param('url') urlMedia: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(urlMedia, updateMediaDto);
  }

  @ApiExcludeEndpoint()
  @TypedRoute.Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
