export interface AnimeLinkResult {
  media_id: bigint;
  page_title: string;
  page_num: number;
  page_url: string;
  data: AnimeLinkResultData[];
}

export interface AnimeLinkResultData {
  title: string;
  data: AnimeLinkResultDataUrl[];
}

export interface AnimeLinkResultDataUrl {
  resolution: string;
  list: AnimeLinkResultDataUrlList[];
}

export interface AnimeLinkResultDataUrlList {
  title: string;
  url: string;
}
