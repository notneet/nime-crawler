import {
  ApiResponse,
  ApiResponseDto,
  createHttpException,
  createPaginatedResponse,
  createSuccessResponse,
} from '@app/common';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { AnimeQueryDto } from '../dto/anime.dto';
import { AnimeGatewayService } from '../services/anime-gateway.service';

@ApiTags('anime')
@Controller({ path: 'anime', version: '1' })
export class AnimeController {
  private readonly logger = new Logger(AnimeController.name);

  constructor(private readonly animeGatewayService: AnimeGatewayService) {}

  @Get()
  @ApiOperation({ summary: 'Get anime list with optional filters' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Anime list retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getAnimeList(@Query() query: AnimeQueryDto): Promise<ApiResponse> {
    try {
      this.logger.log('Fetching anime list with filters', query);

      const result = await this.animeGatewayService.getAnimeList(query);

      return createPaginatedResponse(
        result.anime,
        result.total,
        result.page,
        result.limit,
        'Anime list retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch anime list: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch anime list',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search anime by query string' })
  @ApiQuery({ name: 'q', description: 'Search query (minimum 2 characters)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Anime search completed successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid search query' })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async searchAnime(
    @Query() query: { q: string; limit?: number },
  ): Promise<ApiResponse> {
    try {
      if (!query.q || query.q.trim().length < 2) {
        throw createHttpException(
          'Search query must be at least 2 characters long',
          'VALIDATION_ERROR',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Searching anime with query: ${query.q}`);

      const results = await this.animeGatewayService.searchAnime(
        query.q,
        query.limit || 20,
      );

      return createSuccessResponse(
        'Anime search completed successfully',
        results,
      );
    } catch (error) {
      this.logger.error(
        `Failed to search anime: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw createHttpException(
        'Failed to search anime',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get anime by ID' })
  @ApiParam({ name: 'id', description: 'Anime ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Anime retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 404, description: 'Anime not found' })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getAnimeById(@Param('id') id: string): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching anime with ID: ${id}`);

      const anime = await this.animeGatewayService.getAnimeById(id);

      if (!anime) {
        throw createHttpException(
          'Anime not found',
          'NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      return createSuccessResponse('Anime retrieved successfully', anime);
    } catch (error) {
      this.logger.error(`Failed to fetch anime: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw createHttpException(
        'Failed to fetch anime',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/episodes')
  @ApiOperation({ summary: 'Get episodes for a specific anime' })
  @ApiParam({ name: 'id', description: 'Anime ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Anime episodes retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getAnimeEpisodes(@Param('id') id: string): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching episodes for anime ID: ${id}`);

      const episodes = await this.animeGatewayService.getAnimeEpisodes(id);

      return createSuccessResponse(
        'Anime episodes retrieved successfully',
        episodes,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch anime episodes: ${error.message}`,
        error.stack,
      );

      throw createHttpException(
        'Failed to fetch anime episodes',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get anime statistics summary' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Anime statistics retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getAnimeStats(): Promise<ApiResponse> {
    try {
      this.logger.log('Fetching anime statistics');

      const stats = await this.animeGatewayService.getAnimeStats();

      return createSuccessResponse(
        'Anime statistics retrieved successfully',
        stats,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch anime stats: ${error.message}`,
        error.stack,
      );

      throw createHttpException(
        'Failed to fetch anime statistics',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
