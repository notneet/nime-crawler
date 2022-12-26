import { AnimeSource } from '@libs/commons/dto/anime-souce.dto';
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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AnimeSourceService } from './anime-source.service';

@Controller('anime-source')
@UsePipes(ValidationPipe)
export class AnimeSourceController {
  constructor(private readonly animeSourceService: AnimeSourceService) {}

  @Post()
  async create(@Body() createAnimeSourceDto: AnimeSource) {
    await this.animeSourceService.create(createAnimeSourceDto);
    return new HttpException('data created', HttpStatus.CREATED);
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
  async validateSource(@Param('id', ParseIntPipe) id: number) {
    await this.animeSourceService.validate(id);
    return new HttpException('success validated', HttpStatus.OK);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimeSourceDto: Partial<AnimeSource>,
  ) {
    await this.animeSourceService.update(id, updateAnimeSourceDto);
    return new HttpException('data updated', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.animeSourceService.remove(id);
    return new HttpException('data deleted', HttpStatus.OK);
  }
}
