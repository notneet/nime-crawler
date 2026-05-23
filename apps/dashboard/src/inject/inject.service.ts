import { BadRequestException, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CrawlJobDto } from '@libs/commons/messaging/crawl-job.dto';
import { EXCHANGES, routingKey, Stage } from '@libs/commons/messaging/exchanges';
import { AdapterService } from '@libs/commons/adapters/adapter.service';

export interface InjectSource {
  source: string;
  baseUrl: string;
  stages: Stage[];
}

@Injectable()
export class InjectService {
  constructor(
    private readonly adapters: AdapterService,
    private readonly amqp: AmqpConnection,
  ) {}

  async sources(): Promise<InjectSource[]> {
    const adapters = await this.adapters.enabledAdapters();
    return adapters.map((adapter) => ({
      source: adapter.source,
      baseUrl: adapter.baseUrl,
      stages: Object.keys(adapter.stages) as Stage[],
    }));
  }

  async inject(source: string, stage: string, url: string): Promise<void> {
    const adapter = await this.adapters.get(source);
    if (!adapter || !adapter.enabled) {
      throw new BadRequestException(`no adapter for source "${source}"`);
    }
    if (!(stage in adapter.stages)) {
      throw new BadRequestException(`adapter "${source}" has no "${stage}" stage`);
    }
    const trimmed = url.trim();
    if (!trimmed.startsWith(adapter.baseUrl)) {
      throw new BadRequestException(`url must start with ${adapter.baseUrl}`);
    }
    const job: CrawlJobDto = { source, stage: stage as Stage, url: trimmed, adapter };
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', stage as Stage, source), job);
  }
}
