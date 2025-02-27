export interface AnimeIndexResult {
  media_id: bigint;
  page_title: string;
  page_num: number;
  page_url: string;
  data: AnimeIndexResultData[];
}

export interface AnimeIndexResultData {
  title: string;
  url: string;
}
