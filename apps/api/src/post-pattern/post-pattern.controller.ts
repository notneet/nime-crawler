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
import { PostPatternService } from './post-pattern.service';
import { Prisma } from '@prisma/client';
import { PatternValidationPipe } from '@libs/commons/pipes/pattern-validation.pipe';

@Controller('post-pattern')
export class PostPatternController {
  constructor(private readonly postPatternService: PostPatternService) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  create(
    @Body('pattern', PatternValidationPipe) pPost: string,
    @Body('pagination_pattern', PatternValidationPipe) pPagination: string,
    @Body() createPostPatternDto: Prisma.PostPatternCreateInput,
  ) {
    const data: Prisma.PostPatternCreateInput = {
      ...createPostPatternDto,
      pattern: pPost,
      pagination_pattern: pPagination,
    };

    return this.postPatternService.create(data);
  }

  @Get()
  findAll() {
    return this.postPatternService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.findOne(id);
  }

  @Post('validate/:id')
  validateSource(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.validate(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body('pattern', PatternValidationPipe) pPost: string,
    @Body('pagination_pattern', PatternValidationPipe) pPagination: string,
    @Body() updatePostPatternDto: Prisma.PostPatternUpdateInput,
  ) {
    const data: Prisma.PostPatternUpdateInput = {
      ...updatePostPatternDto,
      pattern: pPost,
      pagination_pattern: pPagination,
    };

    return this.postPatternService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.remove(id);
  }
}
