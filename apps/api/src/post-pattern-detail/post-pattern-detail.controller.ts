import { CreatePostDetailPatternDto } from '@libs/commons/dto/create/create-post-detail-pattern.dto';
import { PatternPostDetailDto } from '@libs/commons/dto/post-pattern-detail.dto';
import { UpdatePostDetailPatternDto } from '@libs/commons/dto/update/update-post-detail-patter.dto';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import { TypedRoute } from '@nestia/core';
import { Body, Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { PostPatternDetailService } from './post-pattern-detail.service';

@Controller({ version: '1', path: 'post-pattern-detail' })
@Serialize(PatternPostDetailDto)
export class PostPatternDetailController {
  constructor(
    private readonly postPatternDetailService: PostPatternDetailService,
  ) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @TypedRoute.Post()
  // @UsePipes(new PatternValidationPipe())
  create(@Body() createPostPatternDetailDto: CreatePostDetailPatternDto) {
    return this.postPatternDetailService.create(createPostPatternDetailDto);
  }

  @TypedRoute.Get()
  findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.postPatternDetailService.findAll(pageOptDto);
  }

  @TypedRoute.Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.findOne(id);
  }

  @TypedRoute.Post('validate/:id')
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.postPatternDetailService.validate(id, Number(body.n_status));
  }

  @TypedRoute.Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostPatternDetailDto: UpdatePostDetailPatternDto,
  ) {
    return this.postPatternDetailService.update(id, updatePostPatternDetailDto);
  }

  @TypedRoute.Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.remove(id);
  }
}
