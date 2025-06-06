import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, In } from 'typeorm';
import { Anime } from '@app/common/entities/core/anime.entity';
import { Episode } from '@app/common/entities/core/episode.entity';
import { AnimeRepository } from '@app/database/repositories/anime.repository';
import {
  AnimeQueryDto,
  AnimeDto,
  EpisodeDto,
  AnimeStatsDto,
} from '../dto/anime.dto';
import { AnimeStatus } from '@app/common';

@Injectable()
export class AnimeGatewayService {
  private readonly logger = new Logger(AnimeGatewayService.name);

  constructor(
    private readonly animeRepository: AnimeRepository,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
  ) {}

  async getAnimeList(query: AnimeQueryDto): Promise<{
    anime: AnimeDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      type,
      status,
      season,
      releaseYear,
      genres,
      minRating,
      sourceId,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = query;

    const findOptions: FindManyOptions<Anime> = {
      relations: ['genres', 'source'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
    };

    const where: any = {};

    if (search) {
      where.title = Like(`%${search}%`);
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (season) {
      where.season = season;
    }

    if (releaseYear) {
      where.release_year = releaseYear;
    }

    if (minRating) {
      where.rating = minRating;
    }

    if (sourceId) {
      where.source_id = BigInt(sourceId);
    }

    findOptions.where = where;

    let [animeList, total] =
      await this.animeRepository.findAndCount(findOptions);

    // Filter by genres if specified
    if (genres && genres.length > 0) {
      animeList = animeList.filter(
        anime =>
          anime.genres &&
          anime.genres.some(genre =>
            genres.some(filterGenre =>
              genre.name.toLowerCase().includes(filterGenre.toLowerCase()),
            ),
          ),
      );
      total = animeList.length;
    }

    const animeDto: AnimeDto[] = animeList.map(anime => ({
      id: anime.id.toString(),
      title: anime.title,
      slug: anime.slug,
      alternativeTitle: anime.alternative_title,
      synopsis: anime.synopsis,
      posterUrl: anime.poster_url,
      bannerUrl: anime.banner_url,
      type: anime.type,
      status: anime.status,
      totalEpisodes: anime.total_episodes,
      releaseYear: anime.release_year,
      season: anime.season,
      rating: anime.rating,
      viewCount: anime.view_count,
      downloadCount: anime.download_count,
      sourceId: anime.source_id.toString(),
      sourceAnimeId: anime.source_anime_id,
      sourceUrl: anime.source_url,
      lastUpdatedAt: anime.last_updated_at,
      createdAt: anime.created_at,
      updatedAt: anime.updated_at,
      genres: anime.genres?.map(genre => genre.name) || [],
    }));

    return {
      anime: animeDto,
      total,
      page,
      limit,
    };
  }

  async searchAnime(
    searchQuery: string,
    limit: number = 20,
  ): Promise<AnimeDto[]> {
    const animeList = await this.animeRepository.find({
      where: [
        { title: Like(`%${searchQuery}%`) },
        { alternative_title: Like(`%${searchQuery}%`) },
      ],
      relations: ['genres', 'source'],
      take: limit,
      order: {
        view_count: 'DESC',
      },
    });

    return animeList.map(anime => ({
      id: anime.id.toString(),
      title: anime.title,
      slug: anime.slug,
      alternativeTitle: anime.alternative_title,
      synopsis: anime.synopsis,
      posterUrl: anime.poster_url,
      bannerUrl: anime.banner_url,
      type: anime.type,
      status: anime.status,
      totalEpisodes: anime.total_episodes,
      releaseYear: anime.release_year,
      season: anime.season,
      rating: anime.rating,
      viewCount: anime.view_count,
      downloadCount: anime.download_count,
      sourceId: anime.source_id.toString(),
      sourceAnimeId: anime.source_anime_id,
      sourceUrl: anime.source_url,
      lastUpdatedAt: anime.last_updated_at,
      createdAt: anime.created_at,
      updatedAt: anime.updated_at,
      genres: anime.genres?.map(genre => genre.name) || [],
    }));
  }

  async getAnimeById(id: string): Promise<AnimeDto | null> {
    const anime = await this.animeRepository.findOne({
      where: { id: BigInt(id) },
      relations: ['genres', 'source', 'episodes'],
    });

    if (!anime) {
      return null;
    }

    return {
      id: anime.id.toString(),
      title: anime.title,
      slug: anime.slug,
      alternativeTitle: anime.alternative_title,
      synopsis: anime.synopsis,
      posterUrl: anime.poster_url,
      bannerUrl: anime.banner_url,
      type: anime.type,
      status: anime.status,
      totalEpisodes: anime.total_episodes,
      releaseYear: anime.release_year,
      season: anime.season,
      rating: anime.rating,
      viewCount: anime.view_count,
      downloadCount: anime.download_count,
      sourceId: anime.source_id.toString(),
      sourceAnimeId: anime.source_anime_id,
      sourceUrl: anime.source_url,
      lastUpdatedAt: anime.last_updated_at,
      createdAt: anime.created_at,
      updatedAt: anime.updated_at,
      genres: anime.genres?.map(genre => genre.name) || [],
      episodes:
        anime.episodes?.map(episode => ({
          id: episode.id.toString(),
          animeId: episode.anime_id.toString(),
          episodeNumber: episode.episode_number,
          title: episode.title,
          sourceEpisodeId: episode.source_episode_id,
          sourceUrl: episode.source_url,
          thumbnailUrl: episode.thumbnail_url,
          description: episode.description,
          durationSeconds: episode.duration_seconds,
          airDate: episode.air_date,
          viewCount: episode.view_count,
          downloadCount: episode.download_count,
          isAvailable: episode.is_available,
          lastCheckedAt: episode.last_checked_at,
          createdAt: episode.created_at,
          updatedAt: episode.updated_at,
        })) || [],
    };
  }

  async getAnimeEpisodes(animeId: string): Promise<EpisodeDto[]> {
    const episodes = await this.episodeRepository.find({
      where: { anime_id: BigInt(animeId) },
      relations: ['download_links'],
      order: { episode_number: 'ASC' },
    });

    return episodes.map(episode => ({
      id: episode.id.toString(),
      animeId: episode.anime_id.toString(),
      episodeNumber: episode.episode_number,
      title: episode.title,
      sourceEpisodeId: episode.source_episode_id,
      sourceUrl: episode.source_url,
      thumbnailUrl: episode.thumbnail_url,
      description: episode.description,
      durationSeconds: episode.duration_seconds,
      airDate: episode.air_date,
      viewCount: episode.view_count,
      downloadCount: episode.download_count,
      isAvailable: episode.is_available,
      lastCheckedAt: episode.last_checked_at,
      createdAt: episode.created_at,
      updatedAt: episode.updated_at,
      downloadLinks:
        episode.download_links?.map(link => ({
          id: link.id.toString(),
          episodeId: link.episode_id.toString(),
          provider: link.provider,
          url: link.url,
          quality: link.quality,
          format: link.format,
          fileSizeBytes: link.file_size_bytes,
          isActive: link.is_active,
          lastCheckedAt: link.last_checked_at,
          createdAt: link.created_at,
          updatedAt: link.updated_at,
        })) || [],
    }));
  }

  async getAnimeStats(): Promise<AnimeStatsDto> {
    const [
      totalAnime,
      totalEpisodes,
      activeAnime,
      completedAnime,
      ongoingAnime,
      recentlyAdded,
      mostPopular,
    ] = await Promise.all([
      this.animeRepository.count(),
      this.episodeRepository.count(),
      this.animeRepository.count({ where: { status: AnimeStatus.AIRING } }),
      this.animeRepository.count({ where: { status: AnimeStatus.COMPLETED } }),
      this.animeRepository.count({ where: { status: AnimeStatus.ONGOING } }),
      this.animeRepository.find({
        take: 10,
        order: { created_at: 'DESC' },
        relations: ['genres'],
      }),
      this.animeRepository.find({
        take: 10,
        order: { view_count: 'DESC' },
        relations: ['genres'],
      }),
    ]);

    // Calculate average rating
    const ratingResult = await this.animeRepository
      .createQueryBuilder('anime')
      .select('AVG(anime.rating)', 'averageRating')
      .where('anime.rating IS NOT NULL')
      .getRawOne();

    const averageRating = parseFloat(ratingResult?.averageRating || '0');

    // Get top genres
    const genreResult = await this.animeRepository
      .createQueryBuilder('anime')
      .leftJoin('anime.genres', 'genre')
      .select('genre.name', 'genre')
      .addSelect('COUNT(anime.id)', 'count')
      .where('genre.name IS NOT NULL')
      .groupBy('genre.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topGenres = genreResult.map(result => ({
      genre: result.genre,
      count: parseInt(result.count),
    }));

    return {
      totalAnime,
      totalEpisodes,
      totalDownloadLinks: 0, // Would need to join with download_links table
      activeAnime,
      completedAnime,
      ongoingAnime,
      totalSources: 0, // Would need to count distinct sources
      activeSources: 0, // Would need to count active sources
      averageRating,
      topGenres,
      recentlyAdded: recentlyAdded.map(anime => ({
        id: anime.id.toString(),
        title: anime.title,
        slug: anime.slug,
        alternativeTitle: anime.alternative_title,
        synopsis: anime.synopsis,
        posterUrl: anime.poster_url,
        bannerUrl: anime.banner_url,
        type: anime.type,
        status: anime.status,
        totalEpisodes: anime.total_episodes,
        releaseYear: anime.release_year,
        season: anime.season,
        rating: anime.rating,
        viewCount: anime.view_count,
        downloadCount: anime.download_count,
        sourceId: anime.source_id.toString(),
        sourceAnimeId: anime.source_anime_id,
        sourceUrl: anime.source_url,
        lastUpdatedAt: anime.last_updated_at,
        createdAt: anime.created_at,
        updatedAt: anime.updated_at,
        genres: anime.genres?.map(genre => genre.name) || [],
      })),
      mostPopular: mostPopular.map(anime => ({
        id: anime.id.toString(),
        title: anime.title,
        slug: anime.slug,
        alternativeTitle: anime.alternative_title,
        synopsis: anime.synopsis,
        posterUrl: anime.poster_url,
        bannerUrl: anime.banner_url,
        type: anime.type,
        status: anime.status,
        totalEpisodes: anime.total_episodes,
        releaseYear: anime.release_year,
        season: anime.season,
        rating: anime.rating,
        viewCount: anime.view_count,
        downloadCount: anime.download_count,
        sourceId: anime.source_id.toString(),
        sourceAnimeId: anime.source_anime_id,
        sourceUrl: anime.source_url,
        lastUpdatedAt: anime.last_updated_at,
        createdAt: anime.created_at,
        updatedAt: anime.updated_at,
        genres: anime.genres?.map(genre => genre.name) || [],
      })),
    };
  }
}
