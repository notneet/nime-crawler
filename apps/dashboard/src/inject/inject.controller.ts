import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { InjectService } from './inject.service';
import { InjectDto, TestConfigDto } from './inject.dto';

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

  @Post('test')
  async test(@Body() body: InjectDto) {
    try {
      const result = await this.inject.test(body.source, body.stage, body.url);
      return { ok: true, stage: body.stage, result };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'test failed';
      return { ok: false, error };
    }
  }

  @Post('test-config')
  async testConfig(@Body() body: TestConfigDto) {
    try {
      const result = await this.inject.testConfig(body.config, body.url, body.baseUrl);
      return { ok: true, stage: body.stage ?? '', result };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'test failed';
      return { ok: false, error };
    }
  }
}
