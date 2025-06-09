import {
  ApiResponse,
  ApiResponseDto,
  createHttpException,
  createPaginatedResponse,
  createSuccessResponse,
} from '@app/common';
import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { SourceQueryDto } from '../dto/source.dto';
import { CrawlerGatewayService } from '../services/crawler-gateway.service';
import { SourceGatewayService } from '../services/source-gateway.service';

@ApiTags('sources')
@Controller({ path: 'source', version: '1' })
export class SourceController {
  private readonly logger = new Logger(SourceController.name);

  constructor(
    private readonly sourceGatewayService: SourceGatewayService,
    private readonly crawlerGatewayService: CrawlerGatewayService,
    @Inject('CRAWLER_SERVICE') private readonly crawlerClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get sources with optional filters' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Sources retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getSources(@Query() query: SourceQueryDto): Promise<ApiResponse> {
    try {
      this.logger.log('Fetching sources with filters', query);

      const result = await this.sourceGatewayService.getSources(query);

      return createPaginatedResponse(
        result.sources,
        result.total,
        result.page,
        result.limit,
        'Sources retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch sources: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch sources',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get source by ID' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Source retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 404, description: 'Source not found' })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceById(@Param('id') id: string): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching source with ID: ${id}`);

      const source = await this.sourceGatewayService.getSourceById(id);

      if (!source) {
        throw createHttpException(
          'Source not found',
          'NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      return createSuccessResponse('Source retrieved successfully', source);
    } catch (error) {
      this.logger.error(
        `Failed to fetch source: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw createHttpException(
        'Failed to fetch source',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/anime')
  @ApiOperation({ summary: 'Get anime from a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Source anime retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceAnime(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching anime for source ID: ${id}`);

      const result = await this.sourceGatewayService.getSourceAnime(
        id,
        page,
        limit,
      );

      return createPaginatedResponse(
        result.anime,
        result.total,
        page,
        limit,
        'Source anime retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch source anime: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch source anime',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get statistics for a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Source statistics retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceStats(@Param('id') id: string): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching statistics for source ID: ${id}`);

      const stats = await this.sourceGatewayService.getSourceStats(id);

      return createSuccessResponse(
        'Source statistics retrieved successfully',
        stats,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch source stats: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch source statistics',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/crawl')
  @ApiOperation({ summary: 'Trigger a crawl for a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiQuery({
    name: 'maxPages',
    required: false,
    description: 'Maximum pages to crawl (default: 5)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Crawl job started successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async crawlSource(
    @Param('id', ParseIntPipe) id: number,
    @Query('maxPages', new DefaultValuePipe(5), ParseIntPipe) maxPages: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Starting crawl for source ID: ${id}`);

      const result = await this.crawlerGatewayService.crawlSource(
        BigInt(id),
        maxPages,
      );

      return createSuccessResponse('Crawl job started successfully', {
        jobId: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to start crawl job: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to start crawl job',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/crawl/advanced')
  @ApiOperation({ summary: 'Trigger an advanced crawl for a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiQuery({
    name: 'maxPages',
    required: false,
    description: 'Maximum pages to crawl (default: 5)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Advanced crawl job started successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async crawlSourceAdvanced(
    @Param('id', ParseIntPipe) id: number,
    @Query('maxPages', new DefaultValuePipe(5), ParseIntPipe) maxPages: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Starting advanced crawl for source ID: ${id}`);

      const result = await firstValueFrom(
        this.crawlerClient.send('crawler.source.crawl.advanced', {
          sourceId: id,
          maxPages,
        }),
      );

      return createSuccessResponse(
        'Advanced crawl job started successfully',
        result,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start advanced crawl job: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to start advanced crawl job',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('crawl/all')
  @ApiOperation({ summary: 'Trigger a crawl for all sources' })
  @ApiQuery({
    name: 'maxPages',
    required: false,
    description: 'Maximum pages to crawl per source (default: 3)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Crawl jobs started successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async crawlAllSources(
    @Query('maxPages', new DefaultValuePipe(3), ParseIntPipe) maxPages: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log('Starting crawl for all sources');

      const result = await this.crawlerGatewayService.crawlAllSources(maxPages);

      return createSuccessResponse('Crawl jobs started successfully', {
        jobIds: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to start crawl jobs: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to start crawl jobs',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('crawl/all/advanced')
  @ApiOperation({ summary: 'Trigger an advanced crawl for all sources' })
  @ApiQuery({
    name: 'maxPages',
    required: false,
    description: 'Maximum pages to crawl per source (default: 3)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Advanced crawl jobs started successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async crawlAllSourcesAdvanced(
    @Query('maxPages', new DefaultValuePipe(3), ParseIntPipe) maxPages: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log('Starting advanced crawl for all sources');

      const result = await firstValueFrom(
        this.crawlerClient.send('crawler.sources.crawl-all.advanced', {
          maxPages,
        }),
      );

      return createSuccessResponse(
        'Advanced crawl jobs started successfully',
        result,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start advanced crawl jobs: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to start advanced crawl jobs',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/health/check')
  @ApiOperation({ summary: 'Check health of a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Source health check completed',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async checkSourceHealth(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Checking health for source ID: ${id}`);

      const result = await this.crawlerGatewayService.checkSourceHealth(
        BigInt(id),
      );

      return createSuccessResponse('Source health check completed', {
        jobId: result,
      });
    } catch (error) {
      this.logger.error(
        `Failed to check source health: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to check source health',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/health/history')
  @ApiOperation({ summary: 'Get health check history for a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of records to return (default: 10)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Source health history retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceHealthHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching health history for source ID: ${id}`);

      const history = await this.crawlerGatewayService.getSourceHealthHistory(
        BigInt(id),
        limit,
      );

      return createSuccessResponse(
        'Source health history retrieved successfully',
        history,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch source health history: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch source health history',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
