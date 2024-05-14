import { AllowedUserRoles } from '@libs/commons/decorators/allowed-role.decorator';
import { CreatePostPatternDto } from '@libs/commons/dto/create/create-post-pattern.dto';
import { UpdatePostPatternDto } from '@libs/commons/dto/update/update-post-pattern.dto';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';
import { TypedRoute } from '@nestia/core';
import { Body, Controller, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { PostPatternService } from './post-pattern.service';

@ApiExcludeController()
@Controller({
  version: '1',
  path: 'post-patterns',
})
// @Serialize(PostPatternDto)
export class PostPatternController {
  constructor(private readonly postPatternService: PostPatternService) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @TypedRoute.Post()
  @AllowedUserRoles(['admin'])
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
  @AllowedUserRoles(['admin'])
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.postPatternService.validate(id, Number(body.n_status));
  }

  @TypedRoute.Patch(':id')
  @AllowedUserRoles(['admin'])
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
