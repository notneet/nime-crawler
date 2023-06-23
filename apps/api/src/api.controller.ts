import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiService } from './api.service';
import { Response } from 'express';

@Controller()
export class ApiController {
  constructor(private readonly appService: ApiService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get(':fileId')
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {}
}
