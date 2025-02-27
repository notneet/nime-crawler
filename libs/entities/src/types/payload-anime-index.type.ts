import { PatternData } from '@entities/types/pattern-data.type';

export interface PayloadMessage {
  dataId?: string;
  media_id: bigint;
  media_url: string;
  page_url: string;
  page_num: number;
  pattern_index: PatternData[];
  pattern_detail: PatternData[];
  pattern_watch: PatternData[];
  pattern_link: PatternData[];
}
