import { AnimeSource } from '@entities/anime-source.entity';
import { Media } from '@entities/media.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PatternDashboardService {
  contentLogin(error?: string): Record<string, any> {
    return {
      title: 'Login',
      layout: 'layouts/home',
      error: error,
      showHeader: false, // Hide header on login page
      oldInput: {
        email: '',
        rememberMe: false,
      },
      emailError: error?.includes('email') ? error : null,
      passwordError: error?.includes('password') ? error : null,
    };
  }

  contentRoot(): Record<string, any> {
    return {
      title: 'Home Page',
      message: 'Welcome to the Index Page!',
      layout: 'layouts/home',
      showHeader: true, // Show header on index page
    };
  }

  contentAnimeSource(sources: AnimeSource[]): Record<string, any> {
    return {
      title: 'Anime Sources',
      layout: 'layouts/home',
      showHeader: true,
      sources,
    };
  }

  contentMedia(mediaList: Media[]): Record<string, any> {
    return {
      title: 'Media List',
      layout: 'layouts/home',
      showHeader: true,
      mediaList,
    };
  }
}
