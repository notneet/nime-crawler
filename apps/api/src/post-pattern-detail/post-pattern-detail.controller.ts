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
import { PatternPostDetailDto } from '@libs/commons/dto/post-pattern-detail.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import { CreatePostDetailPatternDto } from '@libs/commons/dto/create/create-post-detail-pattern.dto';
import { UpdatePostDetailPatternDto } from '@libs/commons/dto/update/update-post-detail-patter.dto';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';

@Controller('post-pattern-detail')
@Serialize(PatternPostDetailDto)
export class PostPatternDetailController {
  constructor(
    private readonly postPatternDetailService: PostPatternDetailService,
  ) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  // @UsePipes(new PatternValidationPipe())
  create(@Body() createPostPatternDetailDto: CreatePostDetailPatternDto) {
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
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.postPatternDetailService.validate(id, Number(body.n_status));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostPatternDetailDto: UpdatePostDetailPatternDto,
  ) {
    return this.postPatternDetailService.update(id, updatePostPatternDetailDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternDetailService.remove(id);
  }
}
