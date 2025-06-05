import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AnimeGatewayService } from '../services/anime-gateway.service';
import { AnimeQueryDto } from '../dto/anime.dto';

@Controller('anime')
export class AnimeController {
  private readonly logger = new Logger(AnimeController.name);

  constructor(private readonly animeGatewayService: AnimeGatewayService) {}

  @Get()
  async getAnimeList(@Query() query: AnimeQueryDto) {
    try {
      this.logger.log('Fetching anime list with filters', query);

      const result = await this.animeGatewayService.getAnimeList(query);

      return {
        success: true,
        message: 'Anime list retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch anime list: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch anime list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  async searchAnime(@Query() query: { q: string; limit?: number }) {
    try {
      if (!query.q || query.q.trim().length < 2) {
        throw new HttpException(
          {
            success: false,
            message: 'Search query must be at least 2 characters long',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Searching anime with query: ${query.q}`);

      const results = await this.animeGatewayService.searchAnime(
        query.q,
        query.limit || 20,
      );

      return {
        success: true,
        message: 'Anime search completed successfully',
        data: {
          query: query.q,
          results,
          total: results.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to search anime: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to search anime',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getAnimeById(@Param('id') id: number) {
    try {
      this.logger.log(`Fetching anime with ID: ${id}`);

      const anime = await this.animeGatewayService.getAnimeById(id);

      if (!anime) {
        throw new HttpException(
          {
            success: false,
            message: 'Anime not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Anime retrieved successfully',
        data: anime,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch anime: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch anime',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/episodes')
  async getAnimeEpisodes(@Param('id') id: number) {
    try {
      this.logger.log(`Fetching episodes for anime ID: ${id}`);

      const episodes = await this.animeGatewayService.getAnimeEpisodes(id);

      return {
        success: true,
        message: 'Anime episodes retrieved successfully',
        data: {
          animeId: id,
          episodes,
          total: episodes.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch anime episodes: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch anime episodes',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/summary')
  async getAnimeStats() {
    try {
      this.logger.log('Fetching anime statistics');

      const stats = await this.animeGatewayService.getAnimeStats();

      return {
        success: true,
        message: 'Anime statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch anime stats: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch anime statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
