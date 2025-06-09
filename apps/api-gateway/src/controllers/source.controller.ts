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
  ApiResponse,
  ApiTags,
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
  @ApiResponse({ status: 200, description: 'Sources retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSources(@Query() query: SourceQueryDto) {
    try {
      this.logger.log('Fetching sources with filters', query);

      const result = await this.sourceGatewayService.getSources(query);

      return {
        success: true,
        message: 'Sources retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch sources: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch sources',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get source by ID' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiResponse({ status: 200, description: 'Source retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceById(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching source with ID: ${id}`);

      const source = await this.sourceGatewayService.getSourceById(id);

      if (!source) {
        throw new HttpException(
          {
            success: false,
            message: 'Source not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Source retrieved successfully',
        data: source,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch source: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch source',
          error: error.message,
        },
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
  @ApiResponse({
    status: 200,
    description: 'Source anime retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceAnime(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      this.logger.log(`Fetching anime for source ID: ${id}`);

      const result = await this.sourceGatewayService.getSourceAnime(
        id,
        page,
        limit,
      );

      return {
        success: true,
        message: 'Source anime retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch source anime: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch source anime',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get statistics for a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiResponse({
    status: 200,
    description: 'Source statistics retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceStats(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching statistics for source ID: ${id}`);

      const stats = await this.sourceGatewayService.getSourceStats(id);

      return {
        success: true,
        message: 'Source statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch source stats: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch source statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/crawl')
  @ApiOperation({ summary: 'Crawl a specific source' })
  @ApiParam({ name: 'id', description: 'Source ID to crawl' })
  @ApiQuery({
    name: 'maxPages',
    description: 'Maximum pages to crawl',
    required: false,
  })
  @ApiResponse({ status: 202, description: 'Crawl job queued' })
  async crawlSource(
    @Param('id', ParseIntPipe) id: number,
    @Query('maxPages', new DefaultValuePipe(5), ParseIntPipe) maxPages: number,
  ) {
    return this.crawlerGatewayService.crawlSource(BigInt(id), maxPages);
  }

  @Post(':id/crawl-advanced')
  @ApiOperation({
    summary: 'Crawl a specific source using three-step method',
    description:
      'Uses the advanced three-step crawler: anime list, anime details, episodes',
  })
  @ApiParam({ name: 'id', description: 'Source ID to crawl' })
  @ApiQuery({
    name: 'maxPages',
    description: 'Maximum pages to crawl',
    required: false,
  })
  @ApiResponse({ status: 202, description: 'Advanced crawl job queued' })
  async crawlSourceAdvanced(
    @Param('id', ParseIntPipe) id: number,
    @Query('maxPages', new DefaultValuePipe(5), ParseIntPipe) maxPages: number,
  ) {
    return firstValueFrom(
      this.crawlerClient.send('crawler.source.crawl.advanced', {
        sourceId: id,
        maxPages,
      }),
    );
  }

  @Post('crawl-all')
  @ApiOperation({ summary: 'Crawl all active sources' })
  @ApiQuery({
    name: 'maxPages',
    description: 'Maximum pages to crawl per source',
    required: false,
  })
  @ApiResponse({ status: 202, description: 'Crawl jobs queued' })
  async crawlAllSources(
    @Query('maxPages', new DefaultValuePipe(3), ParseIntPipe) maxPages: number,
  ) {
    return this.crawlerGatewayService.crawlAllSources(maxPages);
  }

  @Post('crawl-all-advanced')
  @ApiOperation({
    summary: 'Crawl all active sources using three-step method',
    description:
      'Uses the advanced three-step crawler: anime list, anime details, episodes',
  })
  @ApiQuery({
    name: 'maxPages',
    description: 'Maximum pages to crawl per source',
    required: false,
  })
  @ApiResponse({ status: 202, description: 'Advanced crawl jobs queued' })
  async crawlAllSourcesAdvanced(
    @Query('maxPages', new DefaultValuePipe(3), ParseIntPipe) maxPages: number,
  ) {
    return firstValueFrom(
      this.crawlerClient.send('crawler.sources.crawl-all.advanced', {
        maxPages,
      }),
    );
  }

  @Post(':id/check-health')
  @ApiOperation({ summary: 'Check the health of a source' })
  @ApiParam({ name: 'id', description: 'Source ID to check' })
  @ApiResponse({ status: 202, description: 'Health check queued' })
  async checkSourceHealth(@Param('id', ParseIntPipe) id: number) {
    return this.crawlerGatewayService.checkSourceHealth(BigInt(id));
  }

  @Get(':id/health-history')
  @ApiOperation({ summary: 'Get health check history for a source' })
  @ApiParam({ name: 'id', description: 'Source ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records to return',
    required: false,
  })
  async getSourceHealthHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.crawlerGatewayService.getSourceHealthHistory(BigInt(id), limit);
  }
}
