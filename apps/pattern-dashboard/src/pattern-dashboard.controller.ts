import { JwtAuthGuard } from '@commons/auth/guards/jwt-auth.guard';
import { AnimeSourceService } from '@data-access/anime-source/anime-source.service';
import { MediaService } from '@data-access/media/media.service';
import { AnimeSource } from '@entities/anime-source.entity';
import { Media } from '@entities/media.entity';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Render,
  UseGuards,
} from '@nestjs/common';
import { PatternDashboardService } from './pattern-dashboard.service';

@Controller()
export class PatternDashboardController {
  constructor(
    private readonly patternDashboardService: PatternDashboardService,
    private readonly animeSourceService: AnimeSourceService,
    private readonly mediaService: MediaService,
  ) {}

  @Get('login')
  @Render('login')
  loginPage(@Query('error') error: string) {
    return this.patternDashboardService.contentLogin(error);
  }

  @Get()
  @Render('index')
  @UseGuards(JwtAuthGuard)
  rootPage() {
    return this.patternDashboardService.contentRoot();
  }

  @Get('anime-sources')
  @Render('anime-source')
  async animeSourcesPage() {
    const sources = await this.animeSourceService.findAll();

    return this.patternDashboardService.contentAnimeSource(sources);
  }

  @Post('api/anime-sources')
  async createSource(@Body() createSourceDto: Partial<AnimeSource>) {
    // Remove any id if it's accidentally included in the request
    const { id, ...sourceData } = createSourceDto;

    const source = {
      ...sourceData,
      media_id: BigInt(sourceData.media_id.toString()), // Convert string to BigInt
      last_run_at: new Date(),
    };

    return this.animeSourceService.create(source);
  }

  @Put('api/anime-sources/:id')
  async updateSource(
    @Param('id') id: string,
    @Body() updateSourceDto: Partial<AnimeSource>,
  ) {
    const source = {
      ...updateSourceDto,
      media_id: BigInt(updateSourceDto.media_id.toString()), // Convert string to BigInt
    };

    return this.animeSourceService.update(BigInt(id), source);
  }

  @Get('media')
  @Render('media')
  @UseGuards(JwtAuthGuard)
  async mediaPage() {
    const mediaList = await this.mediaService.findAll();

    return this.patternDashboardService.contentMedia(mediaList);
  }

  @Get('api/media/:id')
  @UseGuards(JwtAuthGuard)
  async getMedia(@Param('id') id: string) {
    return this.mediaService.findOne(BigInt(id));
  }

  @Post('api/media')
  @UseGuards(JwtAuthGuard)
  async createMedia(@Body() createMediaDto: Partial<Media>) {
    return this.mediaService.create(createMediaDto);
  }

  @Put('api/media/:id')
  @UseGuards(JwtAuthGuard)
  async updateMedia(
    @Param('id') id: string,
    @Body() updateMediaDto: Partial<Media>,
  ) {
    return this.mediaService.update(BigInt(id), updateMediaDto);
  }
}
