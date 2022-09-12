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
import { PatternValidationPipe } from '@libs/commons/pipes/pattern-validation.pipe';

@Controller('post-pattern-detail')
export class PostPatternDetailController {
  constructor(
    private readonly postPatternDetailService: PostPatternDetailService,
  ) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  create(
    @Body('pattern', PatternValidationPipe) pDetail: string,
    @Body('episode_pattern', PatternValidationPipe) pEpisode: string,
    @Body() createPostPatternDetailDto: Prisma.PostDetailPatternCreateInput,
  ) {
    const data: Prisma.PostDetailPatternCreateInput = {
      ...createPostPatternDetailDto,
      pattern: pDetail,
      episode_pattern: pEpisode,
    };

    return this.postPatternDetailService.create(data);
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
    @Body('pattern', PatternValidationPipe) pDetail: string,
    @Body('episode_pattern', PatternValidationPipe) pEpisode: string,
    @Body() updatePostPatternDetailDto: Prisma.PostDetailPatternUpdateInput,
  ) {
    const data: Prisma.PostDetailPatternUpdateInput = {
      ...updatePostPatternDetailDto,
      pattern: pDetail,
      episode_pattern: pEpisode,
    };

    return this.postPatternDetailService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.remove(id);
  }
}
