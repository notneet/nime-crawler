import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Source } from '@app/common/entities/core/source.entity';

@Injectable()
export class ApiGatewayService {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
  ) {}

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
}
