import { TypedRoute } from '@nestia/core';
import { BadRequestException, Controller, Param } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller()
export class ApiController {
  constructor(private readonly appService: ApiService) {}

  @TypedRoute.Get()
  async getHello(): Promise<Record<string, any>> {
    return this.appService.getWelcome();
  }

  @TypedRoute.Get('sentry/:log')
  async handleSentry(@Param('log') logLevel: string) {
    if (!['debug', 'error'].includes(logLevel)) {
      throw new BadRequestException('log must be "debug" or "error"');
    }

    return this.appService.testSentry(logLevel);
  }
}
