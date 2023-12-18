import { CreatePostPatternDto } from '@libs/commons/dto/create/create-post-pattern.dto';
import { UpdatePostPatternDto } from '@libs/commons/dto/update/update-post-pattern.dto';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';
import { TypedRoute } from '@nestia/core';
import { Body, Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { PostPatternService } from './post-pattern.service';

@Controller({
  version: '1',
  path: 'post-patterns',
})
// @Serialize(PostPatternDto)
export class PostPatternController {
  constructor(private readonly postPatternService: PostPatternService) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @TypedRoute.Post()
  // @UsePipes(new PatternValidationPipe())
  create(@Body() createPostPatternDto: CreatePostPatternDto) {
    return this.postPatternService.create(createPostPatternDto);
  }

  @TypedRoute.Get()
  findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.postPatternService.findAll(pageOptDto);
  }

  @TypedRoute.Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.findOne(id);
  }

  @TypedRoute.Post('validate/:id')
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.postPatternService.validate(id, Number(body.n_status));
  }

  @TypedRoute.Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostPatternDto: UpdatePostPatternDto,
  ) {
    return this.postPatternService.update(id, updatePostPatternDto);
  }

  @TypedRoute.Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.remove(id);
  }
}
