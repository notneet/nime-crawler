import { AnimeStatus, AnimeType } from '../enums/anime.enums';
import {
  DataType,
  ErrorType,
  FileFormat,
  VideoQuality,
} from '../enums/crawler.enums';

export type JsonObject = Record<string, any>;

// ============= INTERFACES & TYPES =============

export interface SourceConfig {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  is_active: boolean;
  priority: number;
  delay_ms: number;
  max_concurrent: number;
  user_agent?: string;
  timeout_seconds: number;
}

export interface ExtractedData {
  title?: string;
  alternative_title?: string;
  synopsis?: string;
  poster_url?: string;
  banner_url?: string;
  type?: AnimeType;
  status?: AnimeStatus;
  total_episodes?: number;
  release_year?: number;
  genres?: string[];
  rating?: number;
  episode_number?: number;
  episode_title?: string;
  download_links?: DownloadLink[];
  video_quality?: VideoQuality;
  file_size?: string;
  server_name?: string;
}

export interface DownloadLink {
  url: string;
  quality: VideoQuality;
  provider: string;
  file_size?: string;
  format?: FileFormat;
}

// ============= VALIDATION SCHEMAS =============

export interface UrlValidationRule {
  protocol?: ('http' | 'https')[];
  domain?: string[];
  max_length?: number;
}

export interface StringValidationRule {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  allow_empty?: boolean;
}

export interface NumberValidationRule {
  min?: number;
  max?: number;
  integer?: boolean;
}

export interface ArrayValidationRule {
  min_items?: number;
  max_items?: number;
  item_type?: DataType;
}

export type ValidationRule =
  | UrlValidationRule
  | StringValidationRule
  | NumberValidationRule
  | ArrayValidationRule;

// ============= TRANSFORMATION SCHEMAS =============

export interface StringTransformation {
  trim?: boolean;
  to_lower_case?: boolean;
  to_upper_case?: boolean;
  remove_html?: boolean;
  normalize_whitespace?: boolean;
}

export interface NumberTransformation {
  round?: number;
  multiply?: number;
  divide?: number;
}

export interface ArrayTransformation {
  unique?: boolean;
  sort?: boolean;
  filter?: string;
}

export type TransformationRule =
  | StringTransformation
  | NumberTransformation
  | ArrayTransformation;

// ============= EXTRACTION CONFIGURATIONS =============

export interface ExtractionRule {
  attribute?: string;
  transform?: TransformationRule;
  validate?: ValidationRule;
  required?: boolean;
  default_value?: any;
}

export interface SelectorConfiguration {
  extract_text?: boolean;
  extract_html?: boolean;
  extract_attribute?: string;
  multiple?: boolean;
  first?: boolean;
  last?: boolean;
  index?: number;
}

// ============= CRAWL JOB INTERFACES =============

export interface CrawlJobPayload {
  source_id: string;
  page_type_id: string;
  url: string;
  priority?: number;
  parameters?: JsonObject;
  retry_count?: number;
  max_retries?: number;
}

export interface CrawlResult {
  success: boolean;
  data?: ExtractedData;
  errors?: string[];
  response_time?: number;
  status_code?: number;
  extracted_fields?: string[];
}

// ============= HEALTH CHECK INTERFACES =============

export interface HealthCheckResult {
  source_id: string;
  is_accessible: boolean;
  response_time?: number;
  status_code?: number;
  error_type?: ErrorType;
  error_message?: string;
  selectors_working: number;
  selectors_failing: number;
  page_structure_changed: boolean;
}
