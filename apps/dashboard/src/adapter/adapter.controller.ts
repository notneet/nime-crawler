import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Render,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdapterAdminService } from './adapter.service';
import { AdapterFormDto } from './adapter-form.dto';

const BLANK_STAGES = JSON.stringify(
  { index: { engine: 'xpath', patterns: [], discover: [] } },
  null,
  2,
);

@Controller('adapter')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AdapterController {
  constructor(private readonly adapters: AdapterAdminService) {}

  @Get()
  @Render('adapter-list')
  async list() {
    const rows = await this.adapters.list();
    return { rows };
  }

  @Get('new')
  @Render('adapter-detail')
  newForm() {
    return { isNew: true, adapter: { enabled: true }, stagesJson: BLANK_STAGES };
  }

  @Get(':source')
  @Render('adapter-detail')
  async edit(@Param('source') source: string) {
    const adapter = await this.adapters.get(source);
    if (!adapter) throw new NotFoundException('adapter not found');
    return { isNew: false, adapter, stagesJson: JSON.stringify(adapter.stages, null, 2) };
  }

  @Post()
  @Render('adapter-detail')
  async create(@Body() form: AdapterFormDto) {
    const res = await this.adapters.create(form);
    if (!res.ok) {
      return { isNew: true, adapter: form, stagesJson: form.stages, error: res.error };
    }
    return { isNew: false, adapter: await this.adapters.get(res.source), stagesJson: form.stages, message: 'Created' };
  }

  @Post(':source')
  @Render('adapter-detail')
  async update(@Param('source') source: string, @Body() form: AdapterFormDto) {
    const res = await this.adapters.update(source, form);
    if (!res.ok) {
      return { isNew: false, adapter: { ...form, source }, stagesJson: form.stages, error: res.error };
    }
    return { isNew: false, adapter: await this.adapters.get(source), stagesJson: form.stages, message: 'Saved' };
  }

  @Post(':source/toggle')
  async toggle(@Param('source') source: string, @Res() res: Response): Promise<void> {
    await this.adapters.toggle(source);
    res.redirect('/adapter');
  }

  @Delete(':source')
  async remove(@Param('source') source: string, @Res() res: Response): Promise<void> {
    await this.adapters.remove(source);
    res.redirect('/adapter');
  }
}
