import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SourceGatewayService } from '../services/source-gateway.service';
import { SourceQueryDto } from '../dto/source.dto';

@Controller('sources')
export class SourceController {
  private readonly logger = new Logger(SourceController.name);

  constructor(private readonly sourceGatewayService: SourceGatewayService) {}

  @Get()
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
  async getSourceById(@Param('id') id: number) {
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
  async getSourceAnime(
    @Param('id') id: number,
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
  async getSourceStats(@Param('id') id: number) {
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
