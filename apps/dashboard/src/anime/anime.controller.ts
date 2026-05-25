import {
  Body,
  Controller,
  Delete,
  Get,
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
import { AnimeService } from './anime.service';
import { AnimeEditDto } from './anime-edit.dto';
import { AnimeCanonicalDto } from './anime-canonical.dto';
import { RecrawlService } from '../recrawl/recrawl.service';
import { buildPager, parseLimit, parsePage } from '../common/pagination';

@Controller('anime')
export class AnimeController {
  constructor(
    private readonly anime: AnimeService,
    private readonly recrawlService: RecrawlService,
  ) {}

  @Get()
  @Render('anime-list')
  async list(
    @Query('q') q = '',
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '',
  ) {
    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const { rows, total } = await this.anime.list(q, page, limit);
    const pager = buildPager({ baseUrl: '/anime', page, limit, total, preserved: { q } });
    return { rows, q, pager };
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const detail = await this.anime.detail(Number(id));
    if (!detail) throw new NotFoundException('anime not found');
    if (detail.isAlias) {
      res.redirect(302, `/anime/${detail.anime.id}`);
      return;
    }
    res.render('anime-detail', detail);
  }

  @Get(':id/episodes')
  @Render('anime-episodes')
  async episodes(
    @Param('id') id: string,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '',
  ) {
    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const data = await this.anime.episodesOf(Number(id), page, limit);
    if (!data) throw new NotFoundException('anime not found');
    const pager = buildPager({ baseUrl: `/anime/${id}/episodes`, page, limit, total: data.total });
    return { ...data, pager };
  }

  @Get(':id/mirrors')
  @Render('anime-mirrors')
  async mirrors(
    @Param('id') id: string,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '',
  ) {
    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const data = await this.anime.mirrorsOf(Number(id), page, limit);
    if (!data) throw new NotFoundException('anime not found');
    const pager = buildPager({ baseUrl: `/anime/${id}/mirrors`, page, limit, total: data.total });
    return { ...data, pager };
  }

  @Get(':id/downloads')
  @Render('anime-downloads')
  async downloads(
    @Param('id') id: string,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '',
  ) {
    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const data = await this.anime.downloadsOf(Number(id), page, limit);
    if (!data) throw new NotFoundException('anime not found');
    const pager = buildPager({ baseUrl: `/anime/${id}/downloads`, page, limit, total: data.total });
    return { ...data, pager };
  }

  @Get(':id/batch')
  @Render('anime-batch')
  async batch(
    @Param('id') id: string,
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '',
  ) {
    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const data = await this.anime.batchOf(Number(id), page, limit);
    if (!data) throw new NotFoundException('anime not found');
    const pager = buildPager({ baseUrl: `/anime/${id}/batch`, page, limit, total: data.total });
    return { ...data, pager };
  }

  @Post(':id')
  @Render('partials/flash')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() patch: AnimeEditDto) {
    const updated = await this.anime.update(Number(id), patch);
    if (!updated) throw new NotFoundException('anime not found');
    return { ok: true, message: 'Saved', layout: false };
  }

  @Post(':id/recrawl')
  @Render('partials/flash')
  async recrawl(@Param('id') id: string) {
    const detail = await this.anime.detail(Number(id));
    if (!detail) throw new NotFoundException('anime not found');
    await this.recrawlService.anime(detail.anime.source, detail.anime.url);
    return { ok: true, message: 'Re-crawl queued', layout: false };
  }

  @Post(':id/link')
  @Render('partials/flash')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async link(@Param('id') id: string, @Body() dto: AnimeCanonicalDto) {
    const result = await this.anime.link(Number(id), dto.canonicalId);
    return { ok: result.ok, message: result.ok ? 'Linked as alias' : result.error, layout: false };
  }

  @Delete(':id/link')
  @Render('partials/flash')
  async unlink(@Param('id') id: string) {
    const ok = await this.anime.unlink(Number(id));
    return { ok, message: ok ? 'Unlinked' : 'Not an alias', layout: false };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<void> {
    await this.anime.remove(Number(id));
    res.redirect('/anime');
  }
}
