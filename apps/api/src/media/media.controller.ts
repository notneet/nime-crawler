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
import { Media, Prisma } from '@prisma/client';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  create(@Body() createMediaDto: Prisma.MediaCreateInput) {
    return this.mediaService.create(createMediaDto);
  }

  @Get()
  findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Get(':url')
  findUrl(@Param('url') urlMedia: string) {
    return this.mediaService.findByUrl(urlMedia);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMediaDto: Prisma.MediaUpdateInput,
  ) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
