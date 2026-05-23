import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { InjectService } from './inject.service';
import { InjectDto } from './inject.dto';

@Controller('inject')
export class InjectController {
  constructor(private readonly inject: InjectService) {}

  @Get()
  @Render('inject')
  async page() {
    const sources = await this.inject.sources();
    return { sources, sourcesJson: JSON.stringify(sources) };
  }

  @Post()
  @Render('partials/flash')
  async submit(@Body() body: InjectDto) {
    try {
      await this.inject.inject(body.source, body.stage, body.url);
      return { ok: true, message: `Injected ${body.stage} · ${body.url}`, layout: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'inject failed';
      return { ok: false, message, layout: false };
    }
  }
}
