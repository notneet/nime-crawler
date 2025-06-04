import { Controller, Get } from '@nestjs/common';
import { LinkCheckerService } from './link-checker.service';

@Controller()
export class LinkCheckerController {
  constructor(private readonly linkCheckerService: LinkCheckerService) {}

  @Get()
  getHello(): string {
    return this.linkCheckerService.getHello();
  }
}
