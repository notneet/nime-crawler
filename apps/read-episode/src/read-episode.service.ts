import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReadEpisodeService {
  private readonly logger = new Logger(ReadEpisodeService.name);

  constructor() {}

  async wait(sec: number) {
    this.logger.warn(`Wait ${sec} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  getHello(): string {
    return 'Hello World!';
  }
}
