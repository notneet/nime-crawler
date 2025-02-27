import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReadIndexService {
  private readonly logger = new Logger(ReadIndexService.name);

  constructor() {}

  constructPayloadAnimeDetail(
    data: PayloadMessage,
    pageUrl: string,
    pageNum: number,
  ): PayloadMessage {
    return {
      media_id: data?.media_id,
      media_url: data?.media_url,
      page_url: pageUrl,
      page_num: pageNum,
      pattern_index: null,
      pattern_detail: data?.pattern_detail || null,
      pattern_watch: data?.pattern_watch || null,
      pattern_link: data?.pattern_link || null,
    } satisfies PayloadMessage;
  }

  async wait(sec: number) {
    this.logger.warn(`Wait ${sec} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  getHello(): string {
    return 'Hello World!';
  }
}
