import {
  ApiResponse,
  ApiResponseDto,
  createHttpException,
  createPaginatedResponse,
  createSuccessResponse,
} from '@app/common';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { CrawlJobQueryDto, ScheduleCrawlJobDto } from '../dto/crawler.dto';
import { CrawlerGatewayService } from '../services/crawler-gateway.service';

@ApiTags('crawler')
@Controller('api/v1/crawler')
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(private readonly crawlerGatewayService: CrawlerGatewayService) {}

  @Post('schedule/full-crawl')
  @ApiOperation({ summary: 'Schedule a full crawl job for a source' })
  @ApiBody({ type: ScheduleCrawlJobDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Full crawl job scheduled successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async scheduleFullCrawl(
    @Body() scheduleDto: ScheduleCrawlJobDto,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(
        `Scheduling full crawl for source ${scheduleDto.sourceId}`,
      );

      const jobId = await this.crawlerGatewayService.scheduleFullCrawl(
        scheduleDto.sourceId,
        scheduleDto.maxPages,
        scheduleDto.priority,
      );

      return createSuccessResponse('Full crawl job scheduled successfully', {
        jobId,
        sourceId: scheduleDto.sourceId,
        maxPages: scheduleDto.maxPages,
        priority: scheduleDto.priority,
        scheduledAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to schedule full crawl: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to schedule full crawl job',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule/update-crawl')
  @ApiOperation({ summary: 'Schedule an update crawl job for a source' })
  @ApiBody({ type: ScheduleCrawlJobDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Update crawl job scheduled successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async scheduleUpdateCrawl(
    @Body() scheduleDto: ScheduleCrawlJobDto,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(
        `Scheduling update crawl for source ${scheduleDto.sourceId}`,
      );

      const jobId = await this.crawlerGatewayService.scheduleUpdateCrawl(
        scheduleDto.sourceId,
        scheduleDto.maxPages,
        scheduleDto.priority,
      );

      return createSuccessResponse('Update crawl job scheduled successfully', {
        jobId,
        sourceId: scheduleDto.sourceId,
        maxPages: scheduleDto.maxPages,
        priority: scheduleDto.priority,
        scheduledAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to schedule update crawl: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to schedule update crawl job',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule/anime/:animeId')
  @ApiOperation({ summary: 'Schedule a crawl job for a specific anime' })
  @ApiParam({ name: 'animeId', description: 'Anime ID to crawl' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Single anime crawl job scheduled successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async scheduleSingleAnimeCrawl(
    @Param('animeId') animeId: string,
    @Body() scheduleDto: Pick<ScheduleCrawlJobDto, 'sourceId' | 'priority'>,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(
        `Scheduling single anime crawl for anime ${animeId}, source ${scheduleDto.sourceId}`,
      );

      const jobId = await this.crawlerGatewayService.scheduleSingleAnimeCrawl(
        scheduleDto.sourceId,
        animeId,
        scheduleDto.priority,
      );

      return createSuccessResponse(
        'Single anime crawl job scheduled successfully',
        {
          jobId,
          animeId,
          sourceId: scheduleDto.sourceId,
          priority: scheduleDto.priority,
          scheduledAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule single anime crawl: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to schedule single anime crawl job',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule/health-check/:sourceId')
  @ApiOperation({ summary: 'Schedule a health check for a source' })
  @ApiParam({ name: 'sourceId', description: 'Source ID to check' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Source health check job scheduled successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async scheduleHealthCheck(
    @Param('sourceId') sourceId: string,
    @Body() body: Pick<ScheduleCrawlJobDto, 'priority'> = { priority: 1 },
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Scheduling health check for source ${sourceId}`);

      const jobId = await this.crawlerGatewayService.scheduleHealthCheck(
        sourceId,
        body.priority,
      );

      return createSuccessResponse(
        'Source health check job scheduled successfully',
        {
          jobId,
          sourceId,
          priority: body.priority,
          scheduledAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule health check: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to schedule health check job',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get crawl jobs with optional filters' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Crawl jobs retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getCrawlJobs(@Query() query: CrawlJobQueryDto): Promise<ApiResponse> {
    try {
      this.logger.log('Fetching crawl jobs with filters', query);

      const result = await this.crawlerGatewayService.getCrawlJobs(query);

      return createPaginatedResponse(
        result.jobs,
        result.total,
        result.page,
        result.limit,
        'Crawl jobs retrieved successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch crawl jobs: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch crawl jobs',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get crawl job status by job ID' })
  @ApiParam({ name: 'jobId', description: 'Crawl job ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Crawl job status retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 404, description: 'Crawl job not found' })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getCrawlJobStatus(@Param('jobId') jobId: string): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching status for crawl job ${jobId}`);

      const status = await this.crawlerGatewayService.getCrawlJobStatus(jobId);

      if (!status) {
        throw createHttpException(
          'Crawl job not found',
          'NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      return createSuccessResponse(
        'Crawl job status retrieved successfully',
        status,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch crawl job status: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw createHttpException(
        'Failed to fetch crawl job status',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sources/:sourceId/health')
  @ApiOperation({ summary: 'Get health status for a source' })
  @ApiParam({ name: 'sourceId', description: 'Source ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Source health status retrieved successfully',
    type: ApiResponseDto,
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceHealth(
    @Param('sourceId') sourceId: string,
  ): Promise<ApiResponse> {
    try {
      this.logger.log(`Fetching health status for source ${sourceId}`);

      const health = await this.crawlerGatewayService.getSourceHealth(sourceId);

      return createSuccessResponse(
        'Source health status retrieved successfully',
        health,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch source health: ${error.message}`,
        error.stack,
      );
      throw createHttpException(
        'Failed to fetch source health status',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
