export interface AnimeDetailResult {
  media_id: bigint;
  page_title: string;
  page_num: number;
  page_url: string;
  data: AnimeDetailResultData;
}

export interface AnimeDetailResultData {
  title: string;
  description: string;
  datetime: Date;
  image_url: string;
  episode_count: string; // conv number
  score: string; // conv number
  episode_list: AnimeDetailResultDataEpisode[];
  batch_url: string;
  // episode_url: string;
}

export interface AnimeDetailResultDataEpisode {
  title: string;
  url: string;
}
