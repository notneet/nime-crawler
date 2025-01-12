import { PipeConfig } from '@helpers/pipes/types/pipe.type';

export type PatternKey =
  | 'container'
  | 'episode_container'
  | 'title'
  | 'url'
  | 'description'
  | 'date'
  | 'image'
  | 'episode_num'
  | 'score'
  | 'episode_complete'
  | 'batch'
  | 'episode_url'
  | 'episode_title';

export interface PatternData {
  key: PatternKey | string;
  data: Data;
}

export type DataReturnType = 'key_value' | 'multiline' | 'value' | 'container';

export interface Data {
  value: string;
  alternative: string;
  return_type: DataReturnType;
  pipes: PipeConfig[];
}
