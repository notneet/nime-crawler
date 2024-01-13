import { EventKey } from '@libs/commons/helper/constant';
import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { AcknolageMessageInterceptor } from './interceptors/acknolage-message.interceptor';
import { ReadAnimeSourceService } from './read-anime-source.service';

interface RMQPayload {
  message: string;
  date: number;
}

/**
 * Bot ini masih belum tau untuk apa....
 */

@Controller()
@UseInterceptors(AcknolageMessageInterceptor)
export class ReadAnimeSourceController {
  private readonly logger = new Logger(ReadAnimeSourceController.name);

  constructor(
    private readonly readAnimeSourceService: ReadAnimeSourceService,
  ) {}

  @EventPattern(EventKey.READ_ANIME_SOURCE)
  async handleBookCreatedEvent(data: string) {
    const payload: RMQPayload = JSON.parse(data);
    return this.logger.log(payload.date);
  }

  @Get()
  getHello(): string {
    return this.readAnimeSourceService.getHello();
  }
}
