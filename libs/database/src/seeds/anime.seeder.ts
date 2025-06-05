import { DataSource } from 'typeorm';
import { Anime, AnimeStatus, AnimeType, AnimeSeason } from '@app/common/entities/core/anime.entity';
import { Source } from '@app/common/entities/core/source.entity';
import { Genre } from '@app/common/entities/core/genre.entity';

export class AnimeSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const animeRepository = dataSource.getRepository(Anime);
    const sourceRepository = dataSource.getRepository(Source);
    const genreRepository = dataSource.getRepository(Genre);

    // Check current anime count
    const currentCount = await animeRepository.count();
    const maxCount = 100;
    
    console.log(`Current anime count: ${currentCount}`);
    
    if (currentCount >= maxCount) {
      console.log(`Database already has ${currentCount} anime entries (max: ${maxCount}). Skipping seeding.`);
      return;
    }

    const toAdd = maxCount - currentCount;
    console.log(`Will add ${toAdd} anime entries to reach ${maxCount} total.`);

    // Create sources first
    const sources = await this.createSources(sourceRepository);
    
    // Create genres
    const genres = await this.createGenres(genreRepository);
    
    // Create anime entries
    await this.createAnimes(animeRepository, sources, genres, toAdd);
  }

  private async createSources(sourceRepository: any): Promise<Source[]> {
    const sourcesData = [
      {
        name: 'Samehadaku',
        slug: 'samehadaku',
        base_url: 'https://samehadaku.tv',
        selectors: {
          title: '.entry-title',
          episode: '.episode-list a',
          download: '.download-links a'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        priority: 1,
        is_active: true,
        delay_ms: 3000
      },
      {
        name: 'Otakudesu',
        slug: 'otakudesu',
        base_url: 'https://otakudesu.lol',
        selectors: {
          title: '.jdlrx h1',
          episode: '.episodelist ul li a',
          download: '.download ul li a'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        priority: 2,
        is_active: true,
        delay_ms: 5000
      },
      {
        name: 'Huntersekai',
        slug: 'huntersekai',
        base_url: 'https://huntersekai.com',
        selectors: {
          title: '.entry-title',
          episode: '.episode-links a',
          download: '.download-section a'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        priority: 3,
        is_active: true,
        delay_ms: 4000
      }
    ];

    const sources: Source[] = [];
    for (const sourceData of sourcesData) {
      let source = await sourceRepository.findOne({ where: { slug: sourceData.slug } });
      if (!source) {
        source = sourceRepository.create(sourceData);
        source = await sourceRepository.save(source);
      }
      sources.push(source);
    }

    return sources;
  }

  private async createGenres(genreRepository: any): Promise<Genre[]> {
    const genresData = [
      { name: 'Action', slug: 'action', description: 'Anime with intense action sequences and battles' },
      { name: 'Adventure', slug: 'adventure', description: 'Anime featuring journeys and quests' },
      { name: 'Comedy', slug: 'comedy', description: 'Anime focused on humor and laughs' },
      { name: 'Drama', slug: 'drama', description: 'Anime with emotional and serious storylines' },
      { name: 'Fantasy', slug: 'fantasy', description: 'Anime set in magical or fantastical worlds' },
      { name: 'Romance', slug: 'romance', description: 'Anime focused on love and relationships' },
      { name: 'School', slug: 'school', description: 'Anime set in school environments' },
      { name: 'Supernatural', slug: 'supernatural', description: 'Anime featuring supernatural elements' },
      { name: 'Slice of Life', slug: 'slice-of-life', description: 'Anime depicting everyday life' },
      { name: 'Sci-Fi', slug: 'sci-fi', description: 'Anime with science fiction elements' },
      { name: 'Thriller', slug: 'thriller', description: 'Anime with suspenseful and thrilling plots' },
      { name: 'Mystery', slug: 'mystery', description: 'Anime with mysterious storylines and puzzles' },
      { name: 'Horror', slug: 'horror', description: 'Anime designed to frighten and create suspense' },
      { name: 'Sports', slug: 'sports', description: 'Anime focused on sports and competitions' },
      { name: 'Mecha', slug: 'mecha', description: 'Anime featuring giant robots or mechanical suits' }
    ];

    const genres: Genre[] = [];
    for (const genreData of genresData) {
      let genre = await genreRepository.findOne({ where: { slug: genreData.slug } });
      if (!genre) {
        genre = genreRepository.create(genreData);
        genre = await genreRepository.save(genre);
      }
      genres.push(genre);
    }

    return genres;
  }

  private async createAnimes(animeRepository: any, sources: Source[], genres: Genre[], targetCount: number): Promise<void> {
    const baseAnimes = [
      {
        title: 'Attack on Titan',
        slug: 'attack-on-titan',
        alternative_title: 'Shingeki no Kyojin',
        synopsis: 'Humanity fights for survival against giant humanoid Titans that devour humans seemingly without reason.',
        type: AnimeType.TV,
        status: AnimeStatus.COMPLETED,
        total_episodes: 75,
        release_year: 2013,
        season: AnimeSeason.SPRING,
        rating: 9.2,
        genreIndexes: [0, 1, 3, 12] // Action, Adventure, Drama, Horror
      },
      {
        title: 'My Hero Academia',
        slug: 'my-hero-academia',
        alternative_title: 'Boku no Hero Academia',
        synopsis: 'In a world where superpowers are common, a boy born without them dreams of becoming a hero.',
        type: AnimeType.TV,
        status: AnimeStatus.ONGOING,
        total_episodes: 138,
        release_year: 2016,
        season: AnimeSeason.SPRING,
        rating: 8.8,
        genreIndexes: [0, 6, 7] // Action, School, Supernatural
      },
      {
        title: 'Demon Slayer',
        slug: 'demon-slayer',
        alternative_title: 'Kimetsu no Yaiba',
        synopsis: 'A young boy becomes a demon slayer to avenge his family and cure his sister.',
        type: AnimeType.TV,
        status: AnimeStatus.COMPLETED,
        total_episodes: 44,
        release_year: 2019,
        season: AnimeSeason.SPRING,
        rating: 9.1,
        genreIndexes: [0, 7, 12] // Action, Supernatural, Horror
      },
      {
        title: 'Your Name',
        slug: 'your-name',
        alternative_title: 'Kimi no Na wa',
        synopsis: 'Two teenagers share a profound, magical connection upon discovering they are swapping bodies.',
        type: AnimeType.MOVIE,
        status: AnimeStatus.COMPLETED,
        total_episodes: 1,
        release_year: 2016,
        season: null,
        rating: 8.9,
        genreIndexes: [3, 4, 5] // Drama, Fantasy, Romance
      },
      {
        title: 'One Piece',
        slug: 'one-piece',
        alternative_title: 'One Piece',
        synopsis: 'Monkey D. Luffy explores the Grand Line with his diverse crew of pirates.',
        type: AnimeType.TV,
        status: AnimeStatus.ONGOING,
        total_episodes: 1000,
        release_year: 1999,
        season: null,
        rating: 9.0,
        genreIndexes: [0, 1, 2] // Action, Adventure, Comedy
      },
      {
        title: 'Spirited Away',
        slug: 'spirited-away',
        alternative_title: 'Sen to Chihiro no Kamikakushi',
        synopsis: 'A young girl enters a world ruled by gods and witches where humans are turned into beasts.',
        type: AnimeType.MOVIE,
        status: AnimeStatus.COMPLETED,
        total_episodes: 1,
        release_year: 2001,
        season: null,
        rating: 9.3,
        genreIndexes: [1, 4, 8] // Adventure, Fantasy, Slice of Life
      },
      {
        title: 'Death Note',
        slug: 'death-note',
        alternative_title: 'Death Note',
        synopsis: 'A high school student discovers a supernatural notebook that kills anyone whose name is written in it.',
        type: AnimeType.TV,
        status: AnimeStatus.COMPLETED,
        total_episodes: 37,
        release_year: 2006,
        season: null,
        rating: 8.7,
        genreIndexes: [7, 10, 11] // Supernatural, Thriller, Mystery
      },
      {
        title: 'Naruto',
        slug: 'naruto',
        alternative_title: 'Naruto',
        synopsis: 'A young ninja who seeks recognition from his peers and dreams of becoming the Hokage.',
        type: AnimeType.TV,
        status: AnimeStatus.COMPLETED,
        total_episodes: 720,
        release_year: 2002,
        season: null,
        rating: 8.4,
        genreIndexes: [0, 1, 2] // Action, Adventure, Comedy
      }
    ];

    const animeTypes = Object.values(AnimeType);
    const animeStatuses = Object.values(AnimeStatus);
    const animeSeasons = Object.values(AnimeSeason);

    // Generate anime entries based on target count
    const animesData: any[] = [];
    
    // Always add all base animes first, then generate additional ones
    baseAnimes.forEach((baseAnime, index) => {
      const sourceIndex = index % sources.length;
      const source = sources[sourceIndex];
      
      animesData.push({
        ...baseAnime,
        poster_url: `https://example.com/posters/${baseAnime.slug}.jpg`,
        banner_url: `https://example.com/banners/${baseAnime.slug}.jpg`,
        view_count: Math.floor(Math.random() * 2000000) + 500000,
        download_count: Math.floor(Math.random() * 500000) + 100000,
        source: source,
        source_anime_id: `${baseAnime.slug}-${String(index + 1).padStart(3, '0')}`,
        source_url: `${source.base_url}/anime/${baseAnime.slug}`,
        genres: baseAnime.genreIndexes.map(i => genres[i])
      });
    });

    // Generate additional animes to reach 100+
    const animeTemplates = [
      'Anime Title', 'Epic Adventure', 'Magic Academy', 'Robot Warrior', 'School Life',
      'Fantasy Quest', 'Space Opera', 'Time Travel', 'Ninja Chronicles', 'Dragon Legends',
      'Ocean Explorer', 'Sky Kingdom', 'Underground City', 'Digital World', 'Ancient Mysteries',
      'Future Wars', 'Musical Dreams', 'Sports Champion', 'Cooking Master', 'Art Academy'
    ];

    // Generate additional animes beyond base animes to have enough options
    // We generate more than needed so we have options when some already exist
    const totalAnimeCount = Math.max(targetCount + baseAnimes.length, 120);
    
    for (let i = baseAnimes.length; i < totalAnimeCount; i++) {
      const templateIndex = i % animeTemplates.length;
      const seriesNumber = Math.floor(i / animeTemplates.length) + 1;
      const template = animeTemplates[templateIndex];
      
      const title = seriesNumber > 1 ? `${template} ${seriesNumber}` : template;
      const slug = title.toLowerCase().replace(/\s+/g, '-');
      
      const randomType = animeTypes[Math.floor(Math.random() * animeTypes.length)];
      const randomStatus = animeStatuses[Math.floor(Math.random() * animeStatuses.length)];
      const randomSeason = Math.random() > 0.3 ? animeSeasons[Math.floor(Math.random() * animeSeasons.length)] : null;
      const randomYear = 2000 + Math.floor(Math.random() * 24);
      const randomEpisodes = randomType === AnimeType.MOVIE ? 1 : Math.floor(Math.random() * 50) + 1;
      const randomRating = Math.round((Math.random() * 4 + 6) * 10) / 10; // 6.0 - 10.0
      
      // Random genres (1-4 genres per anime)
      const numGenres = Math.floor(Math.random() * 4) + 1;
      const selectedGenres: Genre[] = [];
      const usedIndexes = new Set();
      
      for (let j = 0; j < numGenres; j++) {
        let genreIndex;
        do {
          genreIndex = Math.floor(Math.random() * genres.length);
        } while (usedIndexes.has(genreIndex));
        usedIndexes.add(genreIndex);
        selectedGenres.push(genres[genreIndex]);
      }
      
      const sourceIndex = i % sources.length;
      const source = sources[sourceIndex];
      
      animesData.push({
        title: title,
        slug: slug,
        alternative_title: `${title} Alternative`,
        synopsis: `An exciting ${randomType.toLowerCase()} anime about ${template.toLowerCase()} with amazing adventures and character development.`,
        poster_url: `https://example.com/posters/${slug}.jpg`,
        banner_url: `https://example.com/banners/${slug}.jpg`,
        type: randomType,
        status: randomStatus,
        total_episodes: randomEpisodes,
        release_year: randomYear,
        season: randomSeason,
        rating: randomRating,
        view_count: Math.floor(Math.random() * 1000000) + 10000,
        download_count: Math.floor(Math.random() * 200000) + 5000,
        source: source,
        source_anime_id: `${slug}-${String(i + 1).padStart(3, '0')}`,
        source_url: `${source.base_url}/anime/${slug}`,
        genres: selectedGenres
      });
    }

    let addedCount = 0;
    for (const animeData of animesData) {
      if (addedCount >= targetCount) {
        break;
      }

      const existingAnime = await animeRepository.findOne({ 
        where: { slug: animeData.slug } 
      });

      if (!existingAnime) {
        const anime = animeRepository.create({
          title: animeData.title,
          slug: animeData.slug,
          alternative_title: animeData.alternative_title,
          synopsis: animeData.synopsis,
          poster_url: animeData.poster_url,
          banner_url: animeData.banner_url,
          type: animeData.type,
          status: animeData.status,
          total_episodes: animeData.total_episodes,
          release_year: animeData.release_year,
          season: animeData.season,
          rating: animeData.rating,
          view_count: animeData.view_count,
          download_count: animeData.download_count,
          source_id: animeData.source.id,
          source_anime_id: animeData.source_anime_id,
          source_url: animeData.source_url,
          last_updated_at: new Date(),
          genres: animeData.genres
        });

        await animeRepository.save(anime);
        addedCount++;
        console.log(`Seeded anime: ${animeData.title} (${addedCount}/${targetCount})`);
      }
    }

    console.log(`Seeding completed. Added ${addedCount} anime entries.`);
  }
}