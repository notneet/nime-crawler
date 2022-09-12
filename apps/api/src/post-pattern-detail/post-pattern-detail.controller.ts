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
import { PostPatternDetailService } from './post-pattern-detail.service';
import { Prisma } from '@prisma/client';

@Controller('post-pattern-detail')
export class PostPatternDetailController {
  constructor(
    private readonly postPatternDetailService: PostPatternDetailService,
  ) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  create(
    @Body() createPostPatternDetailDto: Prisma.PostDetailPatternCreateInput,
  ) {
    return this.postPatternDetailService.create(createPostPatternDetailDto);
  }

  @Get()
  findAll() {
    return this.postPatternDetailService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.findOne(id);
  }

  @Post('validate/:id')
  validateSource(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.validate(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostPatternDetailDto: Prisma.PostDetailPatternUpdateInput,
  ) {
    return this.postPatternDetailService.update(id, updatePostPatternDetailDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.remove(id);
  }
}
