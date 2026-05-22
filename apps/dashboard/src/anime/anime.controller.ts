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
import { RecrawlService } from '../recrawl/recrawl.service';

const PAGE_SIZE = 20;

@Controller('anime')
export class AnimeController {
  constructor(
    private readonly anime: AnimeService,
    private readonly recrawlService: RecrawlService,
  ) {}

  @Get()
  @Render('anime-list')
  async list(@Query('q') q = '', @Query('page') pageParam = '1') {
    const page = Math.max(1, Number(pageParam) || 1);
    const { rows, total, pageSize } = await this.anime.list(q, page, PAGE_SIZE);
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    return {
      rows,
      total,
      q,
      page,
      hasPrev: page > 1,
      hasNext: page < lastPage,
      prevPage: page - 1,
      nextPage: page + 1,
    };
  }

  @Get(':id')
  @Render('anime-detail')
  async detail(@Param('id') id: string) {
    const detail = await this.anime.detail(Number(id));
    if (!detail) throw new NotFoundException('anime not found');
    return detail;
  }

  @Post(':id')
  @Render('partials/flash')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() patch: AnimeEditDto) {
    const updated = await this.anime.update(Number(id), patch);
    if (!updated) throw new NotFoundException('anime not found');
    return { ok: true, message: 'Saved' };
  }

  @Post(':id/recrawl')
  @Render('partials/flash')
  async recrawl(@Param('id') id: string) {
    const detail = await this.anime.detail(Number(id));
    if (!detail) throw new NotFoundException('anime not found');
    await this.recrawlService.anime(detail.anime.source, detail.anime.url);
    return { ok: true, message: 'Re-crawl queued' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<void> {
    await this.anime.remove(Number(id));
    res.redirect('/anime');
  }
}
