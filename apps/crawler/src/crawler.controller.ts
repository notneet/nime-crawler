import {
  CRAWL_JOB_TYPES,
  MESSAGE_PATTERNS,
  MESSAGE_STATUS,
  SERVICE_NAMES,
} from '@app/common/constants';
import { Controller, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CrawlerMicroservice } from './crawler.microservice';
import {
  CrawlJobMessageDto,
  HealthCheckDto,
  MessageResponseDto,
  ReadThreadDto,
} from './dto/message-patterns.dto';
import { SourceHealthCheckService } from './services/source-health-check.service';

@Controller()
export class CrawlerController implements OnApplicationBootstrap {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(
    private readonly crawlerMicroservice: CrawlerMicroservice,
    private readonly sourceHealthCheckService: SourceHealthCheckService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Crawler microservice starting...');
    // The microservice will initialize itself in onModuleInit
  }

  @MessagePattern(MESSAGE_PATTERNS.CRAWL_JOB)
  async handleCrawlJob(
    @Payload() data: CrawlJobMessageDto,
    @Ctx() context: RmqContext,
  ): Promise<MessageResponseDto> {
    this.logger.log(`Received crawl-job pattern with data:`, data);

    try {
      // Handle the crawl job based on the data received
      const { jobId, data: jobData } = data;
      const { sourceId, jobType, parameters } = jobData;

      let result: string;

      switch (jobType) {
        case CRAWL_JOB_TYPES.FULL_CRAWL:
          result = await this.crawlerMicroservice.requestFullCrawl(
            sourceId,
            parameters?.maxPages,
          );
          break;
        case CRAWL_JOB_TYPES.UPDATE_CRAWL:
          result = await this.crawlerMicroservice.requestUpdateCrawl(
            sourceId,
            parameters?.olderThanHours,
          );
          break;
        case CRAWL_JOB_TYPES.HEALTH_CHECK:
          this.logger.log(`Processing health check for source ${sourceId}`);
          const healthResult =
            await this.sourceHealthCheckService.checkSourceHealth(sourceId);
          result = `Health check completed for source ${sourceId}: ${healthResult.isAccessible ? 'HEALTHY' : 'UNHEALTHY'} (${healthResult.responseTimeMs}ms)`;
          break;
        case CRAWL_JOB_TYPES.SINGLE_ANIME:
          result = await this.crawlerMicroservice.requestAnimeCrawl(
            sourceId,
            parameters?.animeId || BigInt(0),
          );
          break;
        default:
          this.logger.warn(`Unknown job type: ${jobType}`);
          throw new Error(`Unsupported job type: ${jobType}`);
      }

      // Process completed successfully - acknowledge the message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      this.logger.log(
        `Successfully processed crawl job ${jobId} for source ${sourceId}`,
      );

      return {
        jobID: jobId,
        status: MESSAGE_STATUS.COMPLETED,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Extract jobId from data if available
      const jobId = data?.jobId || 'unknown';
      this.logger.error(`Error processing crawl-job ${jobId}:`, error);

      // Negative acknowledge the message - don't requeue to avoid infinite loop
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, false); // Don't requeue on error

      throw error;
    }
  }

  @MessagePattern(MESSAGE_PATTERNS.READ_THREAD)
  async handleReadThread(
    @Payload() data: ReadThreadDto,
    @Ctx() context: RmqContext,
  ): Promise<MessageResponseDto> {
    this.logger.log(`Received read-thread pattern with data:`, data);

    try {
      const { jobID, endPoint } = data;

      // Handle read-thread logic here
      // This seems to be related to reading/fetching data from an endpoint

      this.logger.log(
        `Processing read-thread job ${jobID} for endpoint: ${endPoint}`,
      );

      // Add your read-thread logic here
      // For now, we'll just return a placeholder response
      const result = {
        jobID,
        endPoint,
        status: MESSAGE_STATUS.COMPLETED,
        timestamp: new Date().toISOString(),
        // Add your processing results here
        data: `Processed endpoint: ${endPoint}`,
      };

      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      return result;
    } catch (error) {
      this.logger.error(`Error processing read-thread:`, error);

      // Negative acknowledge the message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, false);

      throw error;
    }
  }

  @MessagePattern(MESSAGE_PATTERNS.HEALTH_CHECK)
  async handleHealthCheck(
    @Payload() _data: HealthCheckDto,
    @Ctx() context: RmqContext,
  ): Promise<MessageResponseDto> {
    console.log(_data);
    this.logger.log(`Received health-check pattern`);

    try {
      const result = {
        jobID: 'health-check-' + Date.now(),
        status: MESSAGE_STATUS.COMPLETED,
        timestamp: new Date().toISOString(),
        result: {
          service: SERVICE_NAMES.CRAWLER,
          version: '1.0.0',
          uptime: process.uptime(),
        },
      };

      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      return result;
    } catch (error) {
      this.logger.error(`Error processing health-check:`, error);

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, false);

      throw error;
    }
  }

  // Catch-all handler for unsupported patterns
  @MessagePattern(MESSAGE_PATTERNS.WILDCARD)
  async handleUnsupportedPattern(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const pattern = context.getPattern();
    this.logger.warn(`Received unsupported pattern: ${pattern}`, data);

    // Negative acknowledge unsupported messages
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.nack(originalMsg, false, false);

    return {
      error: 'Unsupported pattern',
      pattern,
      timestamp: new Date().toISOString(),
    };
  }
}
