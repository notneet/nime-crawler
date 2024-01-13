import { TypedRoute } from '@nestia/core';
import {
  BadRequestException,
  Controller,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { AppInfoDto } from './dtos/welcome.dto';

@ApiTags('Root')
@Controller()
export class ApiController {
  constructor(private readonly appService: ApiService) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Print api info',
    type: AppInfoDto,
  })
  @TypedRoute.Get()
  async getHello(): Promise<Record<string, any>> {
    return this.appService.getWelcome();
  }

  @ApiExcludeEndpoint()
  @TypedRoute.Get('sentry/:log')
  async handleSentry(@Param('log') logLevel: string) {
    if (!['debug', 'error'].includes(logLevel)) {
      throw new BadRequestException('log must be "debug" or "error"');
    }

    return this.appService.testSentry(logLevel);
  }
}
