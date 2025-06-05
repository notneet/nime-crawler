import { Injectable, Logger } from '@nestjs/common';
import { IQueueMetrics } from '@app/common';

@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);
  private readonly metrics: Map<string, IQueueMetrics> = new Map();
  private readonly processingTimes: Map<string, number[]> = new Map();

  /**
   * Initialize metrics for a queue
   */
  initializeQueueMetrics(queueName: string): void {
    if (!this.metrics.has(queueName)) {
      this.metrics.set(queueName, {
        queueName,
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
      });
      
      this.processingTimes.set(queueName, []);
      this.logger.log(`Initialized metrics for queue: ${queueName}`);
    }
  }

  /**
   * Increment job count for specific status
   */
  async incrementJobCount(queueName: string, status: 'produced' | 'processing' | 'completed' | 'failed' | 'retried' | 'scheduled'): Promise<void> {
    this.initializeQueueMetrics(queueName);
    const metrics = this.metrics.get(queueName)!;

    switch (status) {
      case 'produced':
        metrics.totalJobs++;
        metrics.pendingJobs++;
        break;
      case 'processing':
        metrics.pendingJobs = Math.max(0, metrics.pendingJobs - 1);
        metrics.processingJobs++;
        break;
      case 'completed':
        metrics.processingJobs = Math.max(0, metrics.processingJobs - 1);
        metrics.completedJobs++;
        metrics.lastProcessedAt = new Date();
        break;
      case 'failed':
        metrics.processingJobs = Math.max(0, metrics.processingJobs - 1);
        metrics.failedJobs++;
        break;
      case 'retried':
        metrics.pendingJobs++;
        break;
      case 'scheduled':
        metrics.totalJobs++;
        break;
    }

    this.logger.debug(`Updated ${queueName} metrics: ${status} - Total: ${metrics.totalJobs}, Pending: ${metrics.pendingJobs}, Processing: ${metrics.processingJobs}, Completed: ${metrics.completedJobs}, Failed: ${metrics.failedJobs}`);
  }

  /**
   * Update processing time for a queue
   */
  async updateProcessingTime(queueName: string, processingTimeMs: number): Promise<void> {
    this.initializeQueueMetrics(queueName);
    
    let times = this.processingTimes.get(queueName)!;
    times.push(processingTimeMs);

    // Keep only the last 1000 processing times to calculate moving average
    if (times.length > 1000) {
      times = times.slice(-1000);
      this.processingTimes.set(queueName, times);
    }

    // Calculate average processing time
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const metrics = this.metrics.get(queueName)!;
    metrics.averageProcessingTime = Math.round(averageTime);

    this.logger.debug(`Updated processing time for ${queueName}: ${processingTimeMs}ms (avg: ${metrics.averageProcessingTime}ms)`);
  }

  /**
   * Get metrics for a specific queue
   */
  getQueueMetrics(queueName: string): IQueueMetrics | null {
    return this.metrics.get(queueName) || null;
  }

  /**
   * Get metrics for all queues
   */
  getAllMetrics(): IQueueMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset metrics for a specific queue
   */
  resetQueueMetrics(queueName: string): void {
    this.metrics.delete(queueName);
    this.processingTimes.delete(queueName);
    this.logger.log(`Reset metrics for queue: ${queueName}`);
  }

  /**
   * Reset all metrics
   */
  resetAllMetrics(): void {
    this.metrics.clear();
    this.processingTimes.clear();
    this.logger.log('Reset all queue metrics');
  }

  /**
   * Get queue health status
   */
  getQueueHealth(queueName: string): { status: 'healthy' | 'warning' | 'critical'; details: string } {
    const metrics = this.metrics.get(queueName);
    
    if (!metrics) {
      return { status: 'critical', details: 'Queue metrics not found' };
    }

    const totalProcessed = metrics.completedJobs + metrics.failedJobs;
    const failureRate = totalProcessed > 0 ? (metrics.failedJobs / totalProcessed) * 100 : 0;
    const currentlyProcessing = metrics.processingJobs;
    const pending = metrics.pendingJobs;

    // Define health thresholds
    const HIGH_FAILURE_RATE = 20; // 20%
    const HIGH_PENDING_COUNT = 1000;
    const HIGH_PROCESSING_TIME = 30000; // 30 seconds

    if (failureRate > HIGH_FAILURE_RATE) {
      return { status: 'critical', details: `High failure rate: ${failureRate.toFixed(1)}%` };
    }

    if (pending > HIGH_PENDING_COUNT) {
      return { status: 'critical', details: `High pending count: ${pending}` };
    }

    if (metrics.averageProcessingTime > HIGH_PROCESSING_TIME) {
      return { status: 'warning', details: `High processing time: ${metrics.averageProcessingTime}ms` };
    }

    if (failureRate > 5 || pending > 100) {
      return { status: 'warning', details: `Moderate load - Failure rate: ${failureRate.toFixed(1)}%, Pending: ${pending}` };
    }

    return { status: 'healthy', details: 'Queue operating normally' };
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): { status: 'healthy' | 'warning' | 'critical'; details: any[] } {
    const allMetrics = this.getAllMetrics();
    const healthStatuses = allMetrics.map(metrics => ({
      queue: metrics.queueName,
      ...this.getQueueHealth(metrics.queueName),
    }));

    const criticalQueues = healthStatuses.filter(h => h.status === 'critical');
    const warningQueues = healthStatuses.filter(h => h.status === 'warning');

    if (criticalQueues.length > 0) {
      return { status: 'critical', details: healthStatuses };
    }

    if (warningQueues.length > 0) {
      return { status: 'warning', details: healthStatuses };
    }

    return { status: 'healthy', details: healthStatuses };
  }

  /**
   * Get processing time statistics
   */
  getProcessingTimeStats(queueName: string): { min: number; max: number; avg: number; p50: number; p95: number; p99: number } | null {
    const times = this.processingTimes.get(queueName);
    
    if (!times || times.length === 0) {
      return null;
    }

    const sortedTimes = [...times].sort((a, b) => a - b);
    const length = sortedTimes.length;

    return {
      min: sortedTimes[0],
      max: sortedTimes[length - 1],
      avg: Math.round(times.reduce((sum, time) => sum + time, 0) / length),
      p50: sortedTimes[Math.floor(length * 0.5)],
      p95: sortedTimes[Math.floor(length * 0.95)],
      p99: sortedTimes[Math.floor(length * 0.99)],
    };
  }

  /**
   * Export metrics for monitoring systems
   */
  exportMetricsForPrometheus(): string {
    const allMetrics = this.getAllMetrics();
    let output = '';

    allMetrics.forEach(metrics => {
      const queueLabel = `queue="${metrics.queueName}"`;
      
      output += `# HELP queue_total_jobs Total jobs processed by queue\n`;
      output += `# TYPE queue_total_jobs counter\n`;
      output += `queue_total_jobs{${queueLabel}} ${metrics.totalJobs}\n\n`;

      output += `# HELP queue_pending_jobs Pending jobs in queue\n`;
      output += `# TYPE queue_pending_jobs gauge\n`;
      output += `queue_pending_jobs{${queueLabel}} ${metrics.pendingJobs}\n\n`;

      output += `# HELP queue_processing_jobs Currently processing jobs\n`;
      output += `# TYPE queue_processing_jobs gauge\n`;
      output += `queue_processing_jobs{${queueLabel}} ${metrics.processingJobs}\n\n`;

      output += `# HELP queue_completed_jobs Completed jobs\n`;
      output += `# TYPE queue_completed_jobs counter\n`;
      output += `queue_completed_jobs{${queueLabel}} ${metrics.completedJobs}\n\n`;

      output += `# HELP queue_failed_jobs Failed jobs\n`;
      output += `# TYPE queue_failed_jobs counter\n`;
      output += `queue_failed_jobs{${queueLabel}} ${metrics.failedJobs}\n\n`;

      output += `# HELP queue_average_processing_time_ms Average processing time in milliseconds\n`;
      output += `# TYPE queue_average_processing_time_ms gauge\n`;
      output += `queue_average_processing_time_ms{${queueLabel}} ${metrics.averageProcessingTime}\n\n`;
    });

    return output;
  }

  /**
   * Log current metrics summary
   */
  logMetricsSummary(): void {
    const allMetrics = this.getAllMetrics();
    
    if (allMetrics.length === 0) {
      this.logger.log('No queue metrics available');
      return;
    }

    this.logger.log('=== Queue Metrics Summary ===');
    
    allMetrics.forEach(metrics => {
      const health = this.getQueueHealth(metrics.queueName);
      this.logger.log(
        `${metrics.queueName}: Total=${metrics.totalJobs}, Pending=${metrics.pendingJobs}, ` +
        `Processing=${metrics.processingJobs}, Completed=${metrics.completedJobs}, ` +
        `Failed=${metrics.failedJobs}, AvgTime=${metrics.averageProcessingTime}ms, ` +
        `Health=${health.status} (${health.details})`
      );
    });

    const systemHealth = this.getSystemHealth();
    this.logger.log(`Overall System Health: ${systemHealth.status}`);
  }
}