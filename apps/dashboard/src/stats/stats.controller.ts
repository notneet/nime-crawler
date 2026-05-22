import { Controller, Get, Render } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller()
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @Render('stats')
  async index() {
    return this.stats.summary();
  }
}
