import { SourceRepository } from '@app/database/repositories/source.repository';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(private readonly sourceRepository: SourceRepository) {}

  async getHealthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    services: {
      database: string;
      queue: string;
      redis: string;
    };
  }> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    let databaseStatus = 'healthy';
    try {
      await this.sourceRepository.count();
    } catch (error) {
      this.logger.error('Database health check failed', error);
      databaseStatus = 'unhealthy';
    }

    return {
      status: 'ok',
      timestamp,
      uptime,
      version: '1.0.0',
      services: {
        database: databaseStatus,
        queue: 'healthy', // Would need actual RabbitMQ health check
        redis: 'healthy', // Would need actual Redis health check
      },
    };
  }

  getApiInfo(): {
    name: string;
    description: string;
    version: string;
    endpoints: string[];
  } {
    return {
      name: 'NIME Crawler API Gateway',
      description: 'RESTful API for anime crawling and management system',
      version: '1.0.0',
      endpoints: [
        'GET /health - Health check',
        'GET /api/info - API information',
        'GET /crawler/jobs - List crawl jobs',
        'POST /crawler/schedule/full-crawl - Schedule full crawl',
        'POST /crawler/schedule/update-crawl - Schedule update crawl',
        'GET /anime - List anime',
        'GET /anime/search - Search anime',
        'GET /anime/:id - Get anime by ID',
        'GET /sources - List sources',
        'GET /sources/:id - Get source by ID',
        'GET /sources/:id/anime - Get anime for source',
      ],
    };
  }

  async getDetailedApiInfo(): Promise<{
    name: string;
    description: string;
    version: string;
    environment: string;
    uptime: number;
    startTime: string;
    sourceCount: number;
    documentation: string;
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
    }>;
  }> {
    const startTime = new Date(
      Date.now() - process.uptime() * 1000,
    ).toISOString();
    let sourceCount = 0;

    try {
      sourceCount = await this.sourceRepository.count();
    } catch (error) {
      this.logger.error('Failed to get source count', error);
    }

    return {
      name: 'NIME Crawler API Gateway',
      description: 'RESTful API for anime crawling and management system',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      startTime,
      sourceCount,
      documentation: '/docs',
      endpoints: [
        {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
        },
        {
          path: '/api/info',
          method: 'GET',
          description: 'Detailed API information',
        },
        {
          path: '/anime',
          method: 'GET',
          description: 'List and filter anime',
        },
        {
          path: '/anime/search',
          method: 'GET',
          description: 'Search for anime by query',
        },
        {
          path: '/anime/:id',
          method: 'GET',
          description: 'Get anime details by ID',
        },
        {
          path: '/anime/:id/episodes',
          method: 'GET',
          description: 'Get episodes for a specific anime',
        },
        {
          path: '/anime/stats/summary',
          method: 'GET',
          description: 'Get anime statistics summary',
        },
        {
          path: '/sources',
          method: 'GET',
          description: 'List all sources',
        },
        {
          path: '/sources/:id',
          method: 'GET',
          description: 'Get source details by ID',
        },
        {
          path: '/sources/:id/anime',
          method: 'GET',
          description: 'Get anime from a specific source',
        },
        {
          path: '/crawler/jobs',
          method: 'GET',
          description: 'List all crawler jobs',
        },
        {
          path: '/crawler/schedule/full-crawl',
          method: 'POST',
          description: 'Schedule a full crawl job',
        },
        {
          path: '/crawler/schedule/update-crawl',
          method: 'POST',
          description: 'Schedule an update crawl job',
        },
      ],
    };
  }
}
