import { Source } from '@app/common/entities/core/source.entity';
import { SourceHealthRepository } from '@app/database/repositories/source-health.repository';
import { SourceRepository } from '@app/database/repositories/source.repository';
import {
  HtmlFetchResponse,
  HtmlParserOptions,
  HtmlParserService,
} from '@hanivanrizky/nestjs-html-parser';
import { Injectable, Logger } from '@nestjs/common';

export interface HealthCheckResult {
  sourceId: bigint;
  isAccessible: boolean;
  responseTimeMs: number;
  httpStatusCode?: number;
  errorMessage?: string;
  checkedAt: Date;
}

@Injectable()
export class SourceHealthCheckService {
  private readonly logger = new Logger(SourceHealthCheckService.name);

  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly sourceHealthRepository: SourceHealthRepository,
    private readonly htmlParserService: HtmlParserService,
  ) {}

  /**
   * Perform health check on a specific source
   */
  async checkSourceHealth(sourceId: bigint): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let result: HealthCheckResult = {
      sourceId,
      isAccessible: false,
      responseTimeMs: 0,
      checkedAt: new Date(),
    };

    try {
      // Get source details
      const source = await this.sourceRepository.findById(sourceId);
      if (!source) {
        throw new Error(`Source with ID ${sourceId} not found`);
      }

      this.logger.log(
        `Checking health for source: ${source.name} (${source.base_url})`,
      );

      // Perform the health check
      result = await this.performHealthCheck(source, startTime);

      // Save result to database
      await this.saveHealthCheckResult(result);

      this.logger.log(
        `Health check completed for ${source.name}: ${result.isAccessible ? 'HEALTHY' : 'UNHEALTHY'} (${result.responseTimeMs}ms)`,
      );

      return result;
    } catch (error) {
      result = {
        sourceId,
        isAccessible: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage: error.message,
        checkedAt: new Date(),
      };

      await this.saveHealthCheckResult(result);
      this.logger.error(`Health check failed for source ${sourceId}:`, error);

      return result;
    }
  }

  /**
   * Perform health checks on multiple sources
   */
  async checkMultipleSourcesHealth(
    sourceIds: bigint[],
  ): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < sourceIds.length; i += batchSize) {
      const batch = sourceIds.slice(i, i + batchSize);

      const batchPromises = batch.map(sourceId =>
        this.checkSourceHealth(sourceId).catch(error => {
          this.logger.error(`Failed to check source ${sourceId}:`, error);
          return {
            sourceId,
            isAccessible: false,
            responseTimeMs: 0,
            errorMessage: error.message,
            checkedAt: new Date(),
          } as HealthCheckResult;
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a small delay between batches to be respectful
      if (i + batchSize < sourceIds.length) {
        await this.delay(1000); // 1 second delay
      }
    }

    return results;
  }

  /**
   * Check health of all active sources
   */
  async checkAllActiveSourcesHealth(): Promise<HealthCheckResult[]> {
    try {
      const activeSources = await this.sourceRepository.findActiveSources();
      const sourceIds = activeSources.map(source => source.id);

      this.logger.log(
        `Starting health check for ${sourceIds.length} active sources`,
      );

      return await this.checkMultipleSourcesHealth(sourceIds);
    } catch (error) {
      this.logger.error('Failed to check all active sources health:', error);
      return [];
    }
  }

  /**
   * Perform the actual HTTP health check using HTML parser
   */
  private async performHealthCheck(
    source: Source,
    startTime: number,
  ): Promise<HealthCheckResult> {
    try {
      // Prepare request options with proper TypeScript types
      const requestOptions: HtmlParserOptions = {
        timeout: 30000, // 30 seconds timeout
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...source.headers, // Merge source-specific headers
        },
        useRandomUserAgent: true, // Use random user agent for better stealth
        retries: 0, // Single retry attempt for health checks
        retryDelay: 2000, // 2 second delay between retries
        verbose: true, // Disable verbose logging for health checks
        rejectUnauthorized: false, // Don't reject self-signed certificates
        ignoreSSLErrors: true, // Ignore SSL errors for health checks
        maxRedirects: 3, // Follow up to 3 redirects
        retryOnErrors: {
          ssl: false, // Don't retry SSL errors for health checks
          timeout: false, // Don't retry timeouts for health checks
          dns: true, // Retry DNS errors (temporary issues)
          connectionRefused: false, // Don't retry connection refused
        },
      };

      // Use HTML parser service to fetch the page with proper types
      const response: HtmlFetchResponse =
        await this.htmlParserService.fetchHtml(source.base_url, requestOptions);

      const responseTimeMs = Date.now() - startTime;

      // Check if we got a valid response
      const isAccessible = this.isValidResponse(response);

      return {
        sourceId: source.id,
        isAccessible,
        responseTimeMs,
        httpStatusCode: response.status,
        checkedAt: new Date(),
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      // Extract status code from error if available
      let httpStatusCode: number | undefined;
      let errorMessage = error.message || 'Unknown error';

      if (error.response) {
        httpStatusCode = error.response.status;
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.code) {
        errorMessage = `${error.code}: ${error.message}`;
      } else if (error.name) {
        errorMessage = `${error.name}: ${error.message}`;
      }

      // Log specific error types for debugging
      if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Domain not found';
      } else if (error.code === 'ECONNRESET') {
        errorMessage = 'Connection reset';
      } else if (error.code === 'CERT_HAS_EXPIRED') {
        errorMessage = 'SSL certificate expired';
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        errorMessage = 'SSL certificate verification failed';
      }

      this.logger.warn(
        `Health check failed for source ${source.id}: ${errorMessage}`,
      );

      return {
        sourceId: source.id,
        isAccessible: false,
        responseTimeMs,
        httpStatusCode,
        errorMessage,
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Validate if the response indicates a healthy source
   */
  private isValidResponse(response: HtmlFetchResponse): boolean {
    // Check status code (response from @hanivanrizky/nestjs-html-parser)
    if (!response.status || response.status < 200 || response.status >= 400) {
      this.logger.warn(`Invalid status code: ${response.status}`);
      return false;
    }

    // Check if we have content - the package returns HTML in 'data' property
    if (!response.data) {
      this.logger.warn('No data in response');
      return false;
    }

    // Check content length (should have some meaningful content)
    const content = response.data;
    if (typeof content === 'string' && content.length < 100) {
      this.logger.warn(`Content too short: ${content.length} characters`);
      return false;
    }

    // Additional checks for anime sources
    if (typeof content === 'string') {
      const lowerContent = content.toLowerCase();

      // Check for common error indicators
      const errorIndicators = [
        'error 404',
        'page not found',
        'site unavailable',
        'temporarily unavailable',
        'maintenance mode',
        'cloudflare error',
        'access denied',
        'forbidden',
        'server error',
        'bad gateway',
        'service unavailable',
      ];

      if (errorIndicators.some(indicator => lowerContent.includes(indicator))) {
        this.logger.warn(`Found error indicator in content`);
        return false;
      }

      // Check for positive indicators for anime sites
      const positiveIndicators = [
        'anime',
        'episode',
        'watch',
        'stream',
        'download',
        'series',
        'manga',
        'video',
        'play',
        'season',
        'sub',
        'dub',
      ];

      // Check if it looks like an anime site
      const hasAnimeContent = positiveIndicators.some(indicator =>
        lowerContent.includes(indicator),
      );

      if (!hasAnimeContent) {
        this.logger.warn(
          `Source may not be an anime site - no anime-related content found`,
        );
        // Don't fail health check for this, just log a warning
      }

      // Check for basic HTML structure
      if (
        !lowerContent.includes('<html') &&
        !lowerContent.includes('<!doctype')
      ) {
        this.logger.warn('Response does not appear to be valid HTML');
        return false;
      }
    }

    return true;
  }

  /**
   * Save health check result to database
   */
  private async saveHealthCheckResult(
    result: HealthCheckResult,
  ): Promise<void> {
    try {
      const healthRecord = this.sourceHealthRepository.create({
        source_id: result.sourceId,
        is_accessible: result.isAccessible,
        response_time_ms: result.responseTimeMs,
        http_status_code: result.httpStatusCode,
        error_message: result.errorMessage,
        checked_at: result.checkedAt,
      });

      await this.sourceHealthRepository.save(healthRecord);

      // Update the success rate for the last 24 hours
      await this.updateSuccessRate(result.sourceId);
    } catch (error) {
      this.logger.error(
        `Failed to save health check result for source ${result.sourceId}:`,
        error,
      );
    }
  }

  /**
   * Update 24-hour success rate for a source
   */
  private async updateSuccessRate(sourceId: bigint): Promise<void> {
    try {
      const stats = await this.sourceHealthRepository.getHealthStatsForSource(
        sourceId,
        24,
      );

      // Update the latest record with the calculated success rate
      const latestRecord =
        await this.sourceHealthRepository.findLatestBySourceId(sourceId);
      if (latestRecord) {
        // latestRecord.success_rate = Math.round(stats.successRate);
        await this.sourceHealthRepository.save(latestRecord);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update success rate for source ${sourceId}:`,
        error,
      );
    }
  }

  /**
   * Get health statistics for a source
   */
  async getSourceHealthStats(sourceId: bigint): Promise<any> {
    try {
      const [stats, latestCheck, recentChecks] = await Promise.all([
        this.sourceHealthRepository.getHealthStatsForSource(sourceId, 24),
        this.sourceHealthRepository.findLatestBySourceId(sourceId),
        this.sourceHealthRepository.findRecentBySourceId(sourceId, 10),
      ]);

      return {
        sourceId,
        stats,
        latestCheck,
        recentChecks,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get health stats for source ${sourceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
