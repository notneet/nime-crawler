import { Injectable } from '@nestjs/common';
import { SiteAdapter } from './site-adapter.types';

@Injectable()
export class SiteRegistry {
  private readonly bySource = new Map<string, SiteAdapter>();

  constructor(adapters: SiteAdapter[]) {
    for (const a of adapters) {
      this.bySource.set(a.source, a);
    }
  }

  get(source: string): SiteAdapter | undefined {
    return this.bySource.get(source);
  }

  getOrThrow(source: string): SiteAdapter {
    const a = this.bySource.get(source);
    if (!a) {
      throw new Error(`unknown site: ${source}`);
    }
    return a;
  }

  enabledSources(): string[] {
    return [...this.bySource.values()].filter((a) => a.enabled).map((a) => a.source);
  }
}
