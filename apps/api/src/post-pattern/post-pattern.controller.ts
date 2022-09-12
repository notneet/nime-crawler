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

@Controller('post-pattern')
export class PostPatternController {
  constructor(private readonly postPatternService: PostPatternService) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  create(@Body() createPostPatternDto: Prisma.PostPatternCreateInput) {
    return this.postPatternService.create(createPostPatternDto);
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
    @Body() updatePostPatternDto: Prisma.PostPatternUpdateInput,
  ) {
    return this.postPatternService.update(id, updatePostPatternDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.remove(id);
  }
}
