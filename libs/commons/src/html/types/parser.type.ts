import { DataReturnType, PatternData } from '@entities/types/pattern-data.type';
import { PipeConfig } from '@helpers/pipes/types/pipe.type';

export type PatternReturnData = [string, string, DataReturnType, PipeConfig[]];

export type PatternDocumentData<T> = { [K in keyof T]: PatternReturnData };

export interface BaseParseResult {
  media_id: bigint;
  page_num: number;
  page_title: string;
  page_url: string;
}

export interface ParseContext {
  mediaId: bigint;
  pageUrl: string;
  currentPage: number;
  rawHtml: string;
  patternData: PatternData[];
}
