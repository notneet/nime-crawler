import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SourceGatewayService } from '../services/source-gateway.service';
import { SourceQueryDto } from '../dto/source.dto';

@ApiTags('sources')
@Controller({ path: 'sources', version: '1' })
export class SourceController {
  private readonly logger = new Logger(SourceController.name);

  constructor(private readonly sourceGatewayService: SourceGatewayService) {}

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
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Source anime retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSourceAnime(
    @Param('id') id: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    try {
      this.logger.log(`Fetching anime for source ID: ${id}`);

      const result = await this.sourceGatewayService.getSourceAnime(
        id,
        query.page || 1,
        query.limit || 20,
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
  @ApiResponse({ status: 200, description: 'Source statistics retrieved successfully' })
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
}
