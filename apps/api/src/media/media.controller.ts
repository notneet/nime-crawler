import { CreateMediaDto } from '@libs/commons/dto/create/create-media.dto';
import { MediaDto } from '@libs/commons/dto/media.dto';
import { UpdateMediaDto } from '@libs/commons/dto/update/update-media.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
@Serialize(MediaDto)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':url')
  findUrl(@Param('url') urlMedia: string) {
    return this.mediaService.findByUrl(urlMedia);
  }

  @Patch(':url')
  update(
    @Param('url') urlMedia: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(urlMedia, updateMediaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
