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
} from '@nestjs/common';
import { PostPatternService } from './post-pattern.service';
import { PatternValidationPipe } from '@libs/commons/pipes/pattern-validation.pipe';
import { PostPatternDto } from '@libs/commons/dto/post-pattern.dto';
import { ValidatePostPatternDto } from '@libs/commons/dto/update/validate-post-pattern.dto';
import { CreatePostPatternDto } from '@libs/commons/dto/create/create-post-pattern.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import { UpdatePostPatternDto } from '@libs/commons/dto/update/update-post-pattern.dto';
import { ValidatePatternDto } from '@libs/commons/dto/update/validate-pattern.dto';

@Controller('post-pattern')
@Serialize(PostPatternDto)
export class PostPatternController {
  constructor(private readonly postPatternService: PostPatternService) {}

  // pattern & pagination_pattern sould be formatted in JSON.stringify()
  @Post()
  // @UsePipes(new PatternValidationPipe())
  create(@Body() createPostPatternDto: CreatePostPatternDto) {
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
  validateSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ValidatePatternDto,
  ) {
    return this.postPatternService.validate(id, Number(body.n_status));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostPatternDto: UpdatePostPatternDto,
  ) {
    return this.postPatternService.update(id, updatePostPatternDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postPatternService.remove(id);
  }
}
