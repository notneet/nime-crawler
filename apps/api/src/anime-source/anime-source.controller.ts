import { AnimeSourceDto } from '@libs/commons/dto/anime-souce.dto';
import { CreateAnimeSourceDto } from '@libs/commons/dto/create/create-anime-source.dto';
import { UpdateAnimeSourceDto } from '@libs/commons/dto/update/update-anime-source.dto';
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
import { AnimeSourceService } from './anime-source.service';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';

@Controller('anime-source')
@Serialize(AnimeSourceDto)
export class AnimeSourceController {
  constructor(private readonly animeSourceService: AnimeSourceService) {}

  @Post()
  create(@Body() createAnimeSourceDto: CreateAnimeSourceDto) {
    return this.animeSourceService.create(createAnimeSourceDto);
  }

  @Get()
  findAll() {
    return this.animeSourceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animeSourceService.findOne(id);
  }

  @Post('validate/:id')
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.animeSourceService.validate(id, Number(body.n_status));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimeSourceDto: UpdateAnimeSourceDto,
  ) {
    return this.animeSourceService.update(id, updateAnimeSourceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animeSourceService.remove(id);
  }
}
