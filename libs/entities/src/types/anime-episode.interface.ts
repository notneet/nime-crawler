export interface AnimeEpisodeResult {
  media_id: bigint;
  page_title: string;
  page_num: number;
  page_url: string;
  data: AnimeEpisodeResultData;
}

export interface AnimeEpisodeResultData {
  mirror_list: AnimeEpisodeResultDataUrl[];
  download_list: AnimeEpisodeResultDataUrl[];
}

export interface AnimeEpisodeResultDataUrl {
  resolution: string;
  list: AnimeEpisodeResultDataUrlList[];
}

export interface AnimeEpisodeResultDataUrlList {
  title: string;
  url: string;
}
