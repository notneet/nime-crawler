import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CrawlerGatewayService } from '../services/crawler-gateway.service';
import {
  ScheduleCrawlJobDto,
  CrawlJobStatusDto,
  CrawlJobQueryDto,
} from '../dto/crawler.dto';

@Controller('crawler')
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(private readonly crawlerGatewayService: CrawlerGatewayService) {}

  @Post('schedule/full-crawl')
  async scheduleFullCrawl(@Body() scheduleDto: ScheduleCrawlJobDto) {
    try {
      this.logger.log(
        `Scheduling full crawl for source ${scheduleDto.sourceId}`,
      );

      const jobId = await this.crawlerGatewayService.scheduleFullCrawl(
        scheduleDto.sourceId,
        scheduleDto.maxPages,
        scheduleDto.priority,
      );

      return {
        success: true,
        message: 'Full crawl job scheduled successfully',
        data: {
          jobId,
          sourceId: scheduleDto.sourceId,
          maxPages: scheduleDto.maxPages,
          priority: scheduleDto.priority,
          scheduledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to schedule full crawl: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to schedule full crawl job',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule/update-crawl')
  async scheduleUpdateCrawl(@Body() scheduleDto: ScheduleCrawlJobDto) {
    try {
      this.logger.log(
        `Scheduling update crawl for source ${scheduleDto.sourceId}`,
      );

      const jobId = await this.crawlerGatewayService.scheduleUpdateCrawl(
        scheduleDto.sourceId,
        scheduleDto.maxPages,
        scheduleDto.priority,
      );

      return {
        success: true,
        message: 'Update crawl job scheduled successfully',
        data: {
          jobId,
          sourceId: scheduleDto.sourceId,
          maxPages: scheduleDto.maxPages,
          priority: scheduleDto.priority,
          scheduledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to schedule update crawl: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to schedule update crawl job',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule/anime/:animeId')
  async scheduleSingleAnimeCrawl(
    @Param('animeId') animeId: number,
    @Body() scheduleDto: Pick<ScheduleCrawlJobDto, 'sourceId' | 'priority'>,
  ) {
    try {
      this.logger.log(
        `Scheduling single anime crawl for anime ${animeId}, source ${scheduleDto.sourceId}`,
      );

      const jobId = await this.crawlerGatewayService.scheduleSingleAnimeCrawl(
        scheduleDto.sourceId,
        animeId,
        scheduleDto.priority,
      );

      return {
        success: true,
        message: 'Single anime crawl job scheduled successfully',
        data: {
          jobId,
          animeId,
          sourceId: scheduleDto.sourceId,
          priority: scheduleDto.priority,
          scheduledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to schedule single anime crawl: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to schedule single anime crawl job',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schedule/health-check/:sourceId')
  async scheduleHealthCheck(
    @Param('sourceId') sourceId: number,
    @Body() body: Pick<ScheduleCrawlJobDto, 'priority'> = { priority: 1 },
  ) {
    try {
      this.logger.log(`Scheduling health check for source ${sourceId}`);

      const jobId = await this.crawlerGatewayService.scheduleHealthCheck(
        sourceId,
        body.priority,
      );

      return {
        success: true,
        message: 'Source health check job scheduled successfully',
        data: {
          jobId,
          sourceId,
          priority: body.priority,
          scheduledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to schedule health check: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to schedule health check job',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('jobs')
  async getCrawlJobs(@Query() query: CrawlJobQueryDto) {
    try {
      this.logger.log('Fetching crawl jobs with filters', query);

      const jobs = await this.crawlerGatewayService.getCrawlJobs(query);

      return {
        success: true,
        message: 'Crawl jobs retrieved successfully',
        data: jobs,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch crawl jobs: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch crawl jobs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('jobs/:jobId')
  async getCrawlJobStatus(@Param('jobId') jobId: string) {
    try {
      this.logger.log(`Fetching status for crawl job ${jobId}`);

      const status = await this.crawlerGatewayService.getCrawlJobStatus(jobId);

      if (!status) {
        throw new HttpException(
          {
            success: false,
            message: 'Crawl job not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Crawl job status retrieved successfully',
        data: status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch crawl job status: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch crawl job status',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sources/:sourceId/health')
  async getSourceHealth(@Param('sourceId') sourceId: number) {
    try {
      this.logger.log(`Fetching health status for source ${sourceId}`);

      const health = await this.crawlerGatewayService.getSourceHealth(sourceId);

      return {
        success: true,
        message: 'Source health status retrieved successfully',
        data: health,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch source health: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch source health status',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
