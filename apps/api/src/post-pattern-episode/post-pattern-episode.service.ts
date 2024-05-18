import { CreatePostPatternEpisodeDto } from '@libs/commons/dto/create/create-post-pattern-episode.dto';
import { UpdatePostPatternEpisodeDto } from '@libs/commons/dto/update/update-post-pattern-episode.dto';
import { PostEpisodePattern } from '@libs/commons/entities/post-episode-pattern.entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In } from 'typeorm';

@Injectable()
export class PostPatternEpisodeService {
  private readonly postEpisodePatternTableName = 'post_episode_pattern';

  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  create(createPostPatternEpisodeDto: CreatePostPatternEpisodeDto) {
    return 'This action adds a new postPatternEpisode';
  }

  findAll() {
    return `This action returns all postPatternEpisode`;
  }

  async findByMediaIds(id: number[]): Promise<PostEpisodePattern[]> {
    try {
      return this.postPatternEtityMetadata.find({
        where: { media_id: In(id) },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} postPatternEpisode`;
  }

  update(id: number, updatePostPatternEpisodeDto: UpdatePostPatternEpisodeDto) {
    return `This action updates a #${id} postPatternEpisode`;
  }

  remove(id: number) {
    return `This action removes a #${id} postPatternEpisode`;
  }

  /**
   *
   */

  private get baseQuery() {
    return this.eManager
      .createQueryBuilder()
      .from(this.postEpisodePatternTableName, 'q');
  }

  private get postPatternEtityMetadata() {
    return this.eManager.connection.getRepository(PostEpisodePattern);
  }
}
