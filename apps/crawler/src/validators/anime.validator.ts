import { Injectable, Logger } from '@nestjs/common';
import {
  AnimeType,
  AnimeStatus,
  AnimeSeason,
} from '@app/common/entities/core/anime.entity';
import { ScrapedAnimeData } from '../scrapers/anime-scraper.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnimeValidationRules {
  title: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  sourceAnimeId: {
    required: boolean;
    maxLength: number;
  };
  sourceUrl: {
    required: boolean;
    validateUrl: boolean;
  };
  synopsis: {
    maxLength: number;
  };
  totalEpisodes: {
    min: number;
    max: number;
  };
  releaseYear: {
    min: number;
    max: number;
  };
  rating: {
    min: number;
    max: number;
  };
}

@Injectable()
export class AnimeValidator {
  private readonly logger = new Logger(AnimeValidator.name);

  private readonly defaultRules: AnimeValidationRules = {
    title: {
      required: true,
      minLength: 1,
      maxLength: 255,
    },
    sourceAnimeId: {
      required: true,
      maxLength: 100,
    },
    sourceUrl: {
      required: true,
      validateUrl: true,
    },
    synopsis: {
      maxLength: 5000,
    },
    totalEpisodes: {
      min: 1,
      max: 10000,
    },
    releaseYear: {
      min: 1900,
      max: new Date().getFullYear() + 5,
    },
    rating: {
      min: 0,
      max: 10,
    },
  };

  validateScrapedData(
    data: ScrapedAnimeData,
    customRules?: Partial<AnimeValidationRules>,
  ): ValidationResult {
    const rules = { ...this.defaultRules, ...customRules };
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate required fields
      this.validateTitle(data.title, rules.title, errors);
      this.validateSourceAnimeId(
        data.source_anime_id,
        rules.sourceAnimeId,
        errors,
      );
      this.validateSourceUrl(data.source_url, rules.sourceUrl, errors);

      // Validate optional fields
      this.validateSlug(data.slug, errors, warnings);
      this.validateAlternativeTitle(data.alternative_title, errors);
      this.validateSynopsis(data.synopsis, rules.synopsis, errors);
      this.validateUrls(data, errors, warnings);
      this.validateEnums(data, errors, warnings);
      this.validateNumbers(data, rules, errors, warnings);

      const isValid = errors.length === 0;

      if (warnings.length > 0) {
        this.logger.warn(
          `Validation warnings for ${data.title}: ${warnings.join(', ')}`,
        );
      }

      return {
        isValid,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error(`Validation error for ${data.title}:`, error);
      return {
        isValid: false,
        errors: [`Validation exception: ${error.message}`],
        warnings,
      };
    }
  }

  private validateTitle(
    title: string,
    rules: AnimeValidationRules['title'],
    errors: string[],
  ): void {
    if (!title || typeof title !== 'string') {
      if (rules.required) {
        errors.push('Title is required');
      }
      return;
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length < rules.minLength) {
      errors.push(`Title must be at least ${rules.minLength} characters long`);
    }

    if (trimmedTitle.length > rules.maxLength) {
      errors.push(`Title cannot exceed ${rules.maxLength} characters`);
    }

    // Check for suspicious content
    if (this.containsSuspiciousContent(trimmedTitle)) {
      errors.push('Title contains suspicious or invalid content');
    }
  }

  private validateSourceAnimeId(
    sourceAnimeId: string,
    rules: AnimeValidationRules['sourceAnimeId'],
    errors: string[],
  ): void {
    if (!sourceAnimeId || typeof sourceAnimeId !== 'string') {
      if (rules.required) {
        errors.push('Source anime ID is required');
      }
      return;
    }

    const trimmedId = sourceAnimeId.trim();

    if (trimmedId.length === 0) {
      errors.push('Source anime ID cannot be empty');
    }

    if (trimmedId.length > rules.maxLength) {
      errors.push(
        `Source anime ID cannot exceed ${rules.maxLength} characters`,
      );
    }
  }

  private validateSourceUrl(
    sourceUrl: string,
    rules: AnimeValidationRules['sourceUrl'],
    errors: string[],
  ): void {
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      if (rules.required) {
        errors.push('Source URL is required');
      }
      return;
    }

    const trimmedUrl = sourceUrl.trim();

    if (trimmedUrl.length === 0) {
      errors.push('Source URL cannot be empty');
    }

    if (rules.validateUrl) {
      try {
        new URL(trimmedUrl);
      } catch {
        errors.push('Source URL is not a valid URL');
      }
    }
  }

  private validateSlug(
    slug: string,
    errors: string[],
    warnings: string[],
  ): void {
    if (!slug || typeof slug !== 'string') {
      warnings.push('Slug is missing');
      return;
    }

    const trimmedSlug = slug.trim();

    if (trimmedSlug.length === 0) {
      warnings.push('Slug is empty');
      return;
    }

    // Check slug format (should be lowercase, no spaces, no special chars except hyphens)
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(trimmedSlug)) {
      warnings.push(
        'Slug should contain only lowercase letters, numbers, and hyphens',
      );
    }

    // Check for consecutive hyphens
    if (trimmedSlug.includes('--')) {
      warnings.push('Slug contains consecutive hyphens');
    }

    // Check for leading/trailing hyphens
    if (trimmedSlug.startsWith('-') || trimmedSlug.endsWith('-')) {
      warnings.push('Slug should not start or end with hyphens');
    }
  }

  private validateAlternativeTitle(
    alternativeTitle: string | undefined,
    errors: string[],
  ): void {
    if (alternativeTitle !== undefined && alternativeTitle !== null) {
      if (typeof alternativeTitle !== 'string') {
        errors.push('Alternative title must be a string');
        return;
      }

      if (alternativeTitle.length > 255) {
        errors.push('Alternative title cannot exceed 255 characters');
      }
    }
  }

  private validateSynopsis(
    synopsis: string | undefined,
    rules: AnimeValidationRules['synopsis'],
    errors: string[],
  ): void {
    if (synopsis !== undefined && synopsis !== null) {
      if (typeof synopsis !== 'string') {
        errors.push('Synopsis must be a string');
        return;
      }

      if (synopsis.length > rules.maxLength) {
        errors.push(`Synopsis cannot exceed ${rules.maxLength} characters`);
      }
    }
  }

  private validateUrls(
    data: ScrapedAnimeData,
    errors: string[],
    warnings: string[],
  ): void {
    const urlFields = ['poster_url', 'banner_url'] as const;

    for (const field of urlFields) {
      const url = data[field];

      if (url !== undefined && url !== null) {
        if (typeof url !== 'string') {
          errors.push(`${field} must be a string`);
          continue;
        }

        if (url.trim().length === 0) {
          warnings.push(`${field} is empty`);
          continue;
        }

        try {
          new URL(url);
        } catch {
          warnings.push(`${field} is not a valid URL`);
        }
      }
    }
  }

  private validateEnums(
    data: ScrapedAnimeData,
    errors: string[],
    warnings: string[],
  ): void {
    // Validate AnimeType
    if (data.type !== undefined && data.type !== null) {
      if (!Object.values(AnimeType).includes(data.type)) {
        warnings.push(
          `Invalid anime type: ${data.type}. Valid values: ${Object.values(AnimeType).join(', ')}`,
        );
      }
    }

    // Validate AnimeStatus
    if (data.status !== undefined && data.status !== null) {
      if (!Object.values(AnimeStatus).includes(data.status)) {
        warnings.push(
          `Invalid anime status: ${data.status}. Valid values: ${Object.values(AnimeStatus).join(', ')}`,
        );
      }
    }

    // Validate AnimeSeason
    if (data.season !== undefined && data.season !== null) {
      if (!Object.values(AnimeSeason).includes(data.season)) {
        warnings.push(
          `Invalid anime season: ${data.season}. Valid values: ${Object.values(AnimeSeason).join(', ')}`,
        );
      }
    }
  }

  private validateNumbers(
    data: ScrapedAnimeData,
    rules: AnimeValidationRules,
    errors: string[],
    warnings: string[],
  ): void {
    // Validate total_episodes
    if (data.total_episodes !== undefined && data.total_episodes !== null) {
      if (!Number.isInteger(data.total_episodes)) {
        errors.push('Total episodes must be an integer');
      } else if (data.total_episodes < rules.totalEpisodes.min) {
        warnings.push(
          `Total episodes is unusually low: ${data.total_episodes}`,
        );
      } else if (data.total_episodes > rules.totalEpisodes.max) {
        warnings.push(
          `Total episodes is unusually high: ${data.total_episodes}`,
        );
      }
    }

    // Validate release_year
    if (data.release_year !== undefined && data.release_year !== null) {
      if (!Number.isInteger(data.release_year)) {
        errors.push('Release year must be an integer');
      } else if (data.release_year < rules.releaseYear.min) {
        warnings.push(`Release year is unusually old: ${data.release_year}`);
      } else if (data.release_year > rules.releaseYear.max) {
        warnings.push(`Release year is in the future: ${data.release_year}`);
      }
    }

    // Validate rating
    if (data.rating !== undefined && data.rating !== null) {
      if (typeof data.rating !== 'number') {
        errors.push('Rating must be a number');
      } else if (data.rating < rules.rating.min) {
        warnings.push(`Rating is below minimum: ${data.rating}`);
      } else if (data.rating > rules.rating.max) {
        warnings.push(`Rating is above maximum: ${data.rating}`);
      }
    }
  }

  private containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /^\s*$/, // Only whitespace
      /^[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/, // No alphanumeric or common Unicode chars
      /^\d+$/, // Only numbers
      /^[\W_]+$/, // Only special characters
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  validateBulkData(dataList: ScrapedAnimeData[]): {
    valid: ScrapedAnimeData[];
    invalid: Array<{ data: ScrapedAnimeData; errors: string[] }>;
    totalWarnings: number;
  } {
    const valid: ScrapedAnimeData[] = [];
    const invalid: Array<{ data: ScrapedAnimeData; errors: string[] }> = [];
    let totalWarnings = 0;

    for (const data of dataList) {
      const result = this.validateScrapedData(data);

      if (result.isValid) {
        valid.push(data);
      } else {
        invalid.push({ data, errors: result.errors });
      }

      totalWarnings += result.warnings.length;
    }

    this.logger.log(
      `Bulk validation complete: ${valid.length} valid, ${invalid.length} invalid, ${totalWarnings} total warnings`,
    );

    return {
      valid,
      invalid,
      totalWarnings,
    };
  }

  sanitizeScrapedData(data: ScrapedAnimeData): ScrapedAnimeData {
    return {
      ...data,
      title: this.sanitizeString(data.title),
      slug: this.sanitizeSlug(data.slug),
      alternative_title: data.alternative_title
        ? this.sanitizeString(data.alternative_title)
        : undefined,
      synopsis: data.synopsis ? this.sanitizeString(data.synopsis) : undefined,
      source_anime_id: this.sanitizeString(data.source_anime_id),
      source_url: this.sanitizeUrl(data.source_url),
      poster_url: data.poster_url
        ? this.sanitizeUrl(data.poster_url)
        : undefined,
      banner_url: data.banner_url
        ? this.sanitizeUrl(data.banner_url)
        : undefined,
    };
  }

  private sanitizeString(str: string): string {
    return str?.trim().replace(/\s+/g, ' ') || '';
  }

  private sanitizeSlug(slug: string): string {
    return (
      slug
        ?.toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || ''
    );
  }

  private sanitizeUrl(url: string): string {
    return url?.trim() || '';
  }
}
