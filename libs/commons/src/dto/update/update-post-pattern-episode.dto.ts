import { PartialType } from '@nestjs/mapped-types';
import { CreatePostPatternEpisodeDto } from '../create/create-post-pattern-episode.dto';

export class UpdatePostPatternEpisodeDto extends PartialType(
  CreatePostPatternEpisodeDto,
) {}
