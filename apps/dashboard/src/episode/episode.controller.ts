import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  Render,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { EpisodeService } from './episode.service';
import { EpisodeEditDto } from './episode-edit.dto';
import { RecrawlService } from '../recrawl/recrawl.service';
import { buildPager, parseLimit, parsePage } from '../common/pagination';

@Controller('episode')
export class EpisodeController {
  constructor(
    private readonly episode: EpisodeService,
    private readonly recrawlService: RecrawlService,
  ) {}

  @Get(':id')
  @Render('episode-detail')
  async detail(
    @Param('id') id: string,
    @Query('mp') mpParam = '1',
    @Query('ml') mlParam = '',
    @Query('dp') dpParam = '1',
    @Query('dl') dlParam = '',
  ) {
    const mPage = parsePage(mpParam);
    const mLimit = parseLimit(mlParam);
    const dPage = parsePage(dpParam);
    const dLimit = parseLimit(dlParam);
    const detail = await this.episode.detail(Number(id), mPage, mLimit, dPage, dLimit);
    if (!detail) throw new NotFoundException('episode not found');
    const base = `/episode/${id}`;
    const mirrorsPager = buildPager({
      baseUrl: base,
      pageParam: 'mp',
      limitParam: 'ml',
      page: mPage,
      limit: mLimit,
      total: detail.mirrorsTotal,
      preserved: { dp: dPage, dl: dLimit },
    });
    const downloadsPager = buildPager({
      baseUrl: base,
      pageParam: 'dp',
      limitParam: 'dl',
      page: dPage,
      limit: dLimit,
      total: detail.downloadsTotal,
      preserved: { mp: mPage, ml: mLimit },
    });
    return { ...detail, mirrorsPager, downloadsPager };
  }

  @Post(':id')
  @Render('partials/flash')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() patch: EpisodeEditDto) {
    const updated = await this.episode.update(Number(id), patch);
    if (!updated) throw new NotFoundException('episode not found');
    return { ok: true, message: 'Saved', layout: false };
  }

  @Post(':id/recrawl')
  @Render('partials/flash')
  async recrawl(@Param('id') id: string) {
    const detail = await this.episode.detail(Number(id));
    if (!detail) throw new NotFoundException('episode not found');
    await this.recrawlService.episode(detail.episode.source, detail.episode.url);
    return { ok: true, message: 'Re-crawl queued', layout: false };
  }

  @Get(':id/archive')
  @Render('partials/archive-chooser')
  async archiveChooser(@Param('id') id: string) {
    const data = await this.episode.resolvableMirrors(Number(id));
    if (!data) throw new NotFoundException('episode not found');
    return { ...data, layout: false };
  }

  @Post(':id/archive')
  @Render('partials/flash')
  async archive(
    @Param('id') id: string,
    @Body('mirrorId') mirrorId?: string,
    @Body('episodeStream') episodeStream?: string,
    @Body('faststart') faststart?: string,
  ) {
    const res = await this.episode.archive(Number(id), {
      mirrorId: mirrorId ? Number(mirrorId) : undefined,
      episodeStream: episodeStream === 'true' || episodeStream === '1',
      faststart: faststart === 'true' || faststart === '1',
    });
    if (!res.ok) throw new NotFoundException(res.message);
    return { ok: true, message: res.message, layout: false };
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
