import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Render,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { EpisodeService } from './episode.service';
import { EpisodeEditDto } from './episode-edit.dto';
import { RecrawlService } from '../recrawl/recrawl.service';

@Controller('episode')
export class EpisodeController {
  constructor(
    private readonly episode: EpisodeService,
    private readonly recrawlService: RecrawlService,
  ) {}

  @Get(':id')
  @Render('episode-detail')
  async detail(@Param('id') id: string) {
    const detail = await this.episode.detail(Number(id));
    if (!detail) throw new NotFoundException('episode not found');
    return detail;
  }

  @Post(':id')
  @Render('partials/flash')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() patch: EpisodeEditDto) {
    const updated = await this.episode.update(Number(id), patch);
    if (!updated) throw new NotFoundException('episode not found');
    return { ok: true, message: 'Saved' };
  }

  @Post(':id/recrawl')
  @Render('partials/flash')
  async recrawl(@Param('id') id: string) {
    const detail = await this.episode.detail(Number(id));
    if (!detail) throw new NotFoundException('episode not found');
    await this.recrawlService.episode(detail.episode.source, detail.episode.url);
    return { ok: true, message: 'Re-crawl queued' };
  }

  @Delete('mirror/:id')
  @Header('Content-Type', 'text/html')
  async deleteMirror(@Param('id') id: string): Promise<string> {
    await this.episode.deleteMirror(Number(id));
    return '';
  }

  @Delete('download/:id')
  @Header('Content-Type', 'text/html')
  async deleteDownload(@Param('id') id: string): Promise<string> {
    await this.episode.deleteDownload(Number(id));
    return '';
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<void> {
    await this.episode.remove(Number(id));
    res.redirect('/anime');
  }
}
