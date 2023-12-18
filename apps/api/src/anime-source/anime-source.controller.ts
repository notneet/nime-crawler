import { CreateAnimeSourceDto } from '@libs/commons/dto/create/create-anime-source.dto';
import { UpdateAnimeSourceDto } from '@libs/commons/dto/update/update-anime-source.dto';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';
import { TypedRoute } from '@nestia/core';
import { Body, Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { AnimeSourceService } from './anime-source.service';

@Controller({
  version: '1',
  path: 'anime-sources',
})
// @Serialize(AnimeSourceDto)
export class AnimeSourceController {
  constructor(private readonly animeSourceService: AnimeSourceService) {}

  @TypedRoute.Post()
  create(@Body() createAnimeSourceDto: CreateAnimeSourceDto) {
    return this.animeSourceService.create(createAnimeSourceDto);
  }

  @TypedRoute.Get()
  findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.animeSourceService.findAll(pageOptDto);
  }

  @TypedRoute.Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animeSourceService.findOne(id);
  }

  @TypedRoute.Post('validate/:id')
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.animeSourceService.validate(id, Number(body.n_status));
  }

  @TypedRoute.Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimeSourceDto: UpdateAnimeSourceDto,
  ) {
    return this.animeSourceService.update(id, updateAnimeSourceDto);
  }

  @TypedRoute.Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animeSourceService.remove(id);
  }
}
