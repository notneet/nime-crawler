import { IBrowserRequest } from '@commons/types/browser.type';
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
  | 'episode_title'
  | 'link_container'
  | 'resolution'
  | 'link'
  | 'link_title'
  | 'link_url';

export interface PatternData {
  key: PatternKey | string;
  data: Data | IBrowserRequest;
}

export type DataReturnType = 'key_value' | 'multiline' | 'value' | 'container';

export interface Data {
  value: string;
  alternative: string;
  return_type: DataReturnType;
  pipes: PipeConfig[];
}
