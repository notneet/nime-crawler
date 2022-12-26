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
import { PostPatternService } from './post-pattern.service';
import { PatternValidationPipe } from '@libs/commons/pipes/pattern-validation.pipe';
import { PostPattern } from '@libs/commons/dto/post-pattern.dto';

@Controller('post-pattern')
@UsePipes(ValidationPipe)
export class PostPatternController {
  constructor(private readonly postPatternService: PostPatternService) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  async create(
    @Body() createPostPatternDto: PostPattern,
    @Body('pattern', PatternValidationPipe) pPost: string,
    @Body('pagination_pattern', PatternValidationPipe) pPagination: string,
  ) {
    const data: PostPattern = {
      ...createPostPatternDto,
      pattern: pPost,
      pagination_pattern: pPagination,
    };

    await this.postPatternService.create(data);
    return new HttpException('data created', HttpStatus.CREATED);
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
  async validateSource(@Param('id', ParseIntPipe) id: number) {
    await this.postPatternService.validate(id);
    return new HttpException('success validated', HttpStatus.OK);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('pattern', PatternValidationPipe) pPost: string,
    @Body('pagination_pattern', PatternValidationPipe) pPagination: string,
    @Body() updatePostPatternDto: Partial<PostPattern>,
  ) {
    const data: Partial<PostPattern> = {
      ...updatePostPatternDto,
      pattern: pPost,
      pagination_pattern: pPagination,
    };

    await this.postPatternService.update(id, data);
    return new HttpException('data updated', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.postPatternService.remove(id);
    return new HttpException('data deleted', HttpStatus.OK);
  }
}
