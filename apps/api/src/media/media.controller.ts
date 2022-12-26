import { Media } from '@libs/commons/dto/media.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
@UsePipes(ValidationPipe)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  async create(@Body() createMediaDto: Media) {
    await this.mediaService.create(createMediaDto);
    return new HttpException('data inserted', HttpStatus.CREATED);
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
  async update(
    @Param('url') urlMedia: string,
    @Body() updateMediaDto: Partial<Media>,
  ) {
    await this.mediaService.update(urlMedia, updateMediaDto);
    return new HttpException('data updated', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.mediaService.remove(id);
    return new HttpException('data deleted', HttpStatus.OK);
  }
}
