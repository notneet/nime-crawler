import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PostPatternDetailService } from './post-pattern-detail.service';
import { PatternPostDetail } from '@libs/commons/dto/post-pattern-detail.dto';
import { PatternValidationPipe } from '@libs/commons/pipes/pattern-validation.pipe';

@Controller('post-pattern-detail')
@UsePipes(ValidationPipe)
export class PostPatternDetailController {
  constructor(
    private readonly postPatternDetailService: PostPatternDetailService,
  ) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  async create(
    @Body() createPostPatternDetailDto: PatternPostDetail,
    @Body('pattern', PatternValidationPipe) pDetail: string,
    @Body('episode_pattern', PatternValidationPipe) pEpisode: string,
  ) {
    const data: PatternPostDetail = {
      ...createPostPatternDetailDto,
      pattern: pDetail,
      episode_pattern: pEpisode,
    };

    await this.postPatternDetailService.create(data);
    return new HttpException('data created', HttpStatus.CREATED);
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
  async validateSource(@Param('id', ParseIntPipe) id: number) {
    await this.postPatternDetailService.validate(id);
    return new HttpException('success validated', HttpStatus.OK);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('pattern', PatternValidationPipe) pDetail: string,
    @Body('episode_pattern', PatternValidationPipe) pEpisode: string,
    @Body() updatePostPatternDetailDto: Partial<PatternPostDetail>,
  ) {
    const data: Partial<PatternPostDetail> = {
      ...updatePostPatternDetailDto,
      pattern: pDetail,
      episode_pattern: pEpisode,
    };

    await this.postPatternDetailService.update(id, data);
    return new HttpException('data updated', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.postPatternDetailService.remove(id);
    return new HttpException('data deleted', HttpStatus.OK);
  }
}
