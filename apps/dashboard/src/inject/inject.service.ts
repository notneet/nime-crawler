import { BadRequestException, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CrawlJobDto } from '@libs/commons/messaging/crawl-job.dto';
import { EXCHANGES, routingKey, Stage } from '@libs/commons/messaging/exchanges';
import { AdapterService } from '@libs/commons/adapters/adapter.service';
import { EngineService } from '@libs/commons/engine/engine.service';
import { StageConfig } from '@libs/commons/adapters/site-adapter.types';

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
    private readonly engine: EngineService,
  ) {}

  async sources(): Promise<InjectSource[]> {
    const adapters = await this.adapters.enabledAdapters();
    return adapters.map((adapter) => ({
      source: adapter.source,
      baseUrl: adapter.baseUrl,
      stages: Object.keys(adapter.stages) as Stage[],
    }));
  }

  private static origin(url: string): string {
    try { return new URL(url).origin; } catch { return url.trim(); }
  }

  private async resolve(source: string, stage: string, url: string) {
    const adapter = await this.adapters.get(source);
    if (!adapter || !adapter.enabled) {
      throw new BadRequestException(`no adapter for source "${source}"`);
    }
    if (!(stage in adapter.stages)) {
      throw new BadRequestException(`adapter "${source}" has no "${stage}" stage`);
    }
    const trimmed = url.trim();
    if (InjectService.origin(trimmed) !== InjectService.origin(adapter.baseUrl)) {
      throw new BadRequestException(`url must be on ${InjectService.origin(adapter.baseUrl)}`);
    }
    return { adapter, trimmed };
  }

  async inject(source: string, stage: string, url: string, noDiscover = false): Promise<void> {
    const { adapter, trimmed } = await this.resolve(source, stage, url);
    const job: CrawlJobDto = { source, stage: stage as Stage, url: trimmed, adapter };
    if (noDiscover) job.noDiscover = true;
    await this.amqp.publish(EXCHANGES.crawl, routingKey('crawl', stage as Stage, source), job);
  }

  async test(source: string, stage: string, url: string): Promise<Record<string, unknown>> {
    const { adapter, trimmed } = await this.resolve(source, stage, url);
    const config = adapter.stages[stage as Stage];
    return this.engine.parse(config!, trimmed);
  }

  async testConfig(config: StageConfig, url: string, baseUrl: string): Promise<Record<string, unknown>> {
    const trimmed = url.trim();
    if (InjectService.origin(trimmed) !== InjectService.origin(baseUrl)) {
      throw new BadRequestException(`url must be on ${InjectService.origin(baseUrl)}`);
    }
    return this.engine.parse(config, trimmed);
  }
}
