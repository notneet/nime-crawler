import { CreatePostPatternEpisodeDto } from '@libs/commons/dto/create/create-post-pattern-episode.dto';
import { UpdatePostPatternEpisodeDto } from '@libs/commons/dto/update/update-post-pattern-episode.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PostPatternEpisodeService } from './post-pattern-episode.service';

@Controller('post-pattern-episode')
export class PostPatternEpisodeController {
  constructor(
    private readonly postPatternEpisodeService: PostPatternEpisodeService,
  ) {}

  @Post()
  create(@Body() createPostPatternEpisodeDto: CreatePostPatternEpisodeDto) {
    return this.postPatternEpisodeService.create(createPostPatternEpisodeDto);
  }

  @Get()
  findAll() {
    return this.postPatternEpisodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postPatternEpisodeService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostPatternEpisodeDto: UpdatePostPatternEpisodeDto,
  ) {
    return this.postPatternEpisodeService.update(
      +id,
      updatePostPatternEpisodeDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postPatternEpisodeService.remove(+id);
  }
}
