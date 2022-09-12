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
import { AnimeSource, Prisma } from '@prisma/client';
import { AnimeSourceService } from './anime-source.service';

@Controller('anime-source')
export class AnimeSourceController {
  constructor(private readonly animeSourceService: AnimeSourceService) {}

  @Post()
  create(@Body() createAnimeSourceDto: Prisma.AnimeSourceCreateInput) {
    return this.animeSourceService.create(createAnimeSourceDto);
  }

  @Get()
  findAll(): Promise<AnimeSource[]> {
    return this.animeSourceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AnimeSource> {
    return this.animeSourceService.findOne(id);
  }

  @Post('validate/:id')
  validateSource(@Param('id', ParseIntPipe) id: number) {
    return this.animeSourceService.validate(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimeSourceDto: Prisma.AnimeSourceUpdateInput,
  ) {
    return this.animeSourceService.update(id, updateAnimeSourceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animeSourceService.remove(id);
  }
}
