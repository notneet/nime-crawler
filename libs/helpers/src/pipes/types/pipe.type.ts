import { DateFormatPipeConfig } from './date-format.type';
import { NumberNormalizePipeConfig } from './number-normalize.type';
import { ParseUrlPipeConfig } from './parse-url.type';
import { RegexReplacePipeConfig } from './regex-replace.type';

export interface BasePipeOptions {
  [key: string]: any;
}

export interface BasePipeConfig {
  name: string;
  options?: BasePipeOptions;
}

export enum PipeName {
  REGEX_REPLACE = 'regex-replace',
  NUMBER_NORMALIZE = 'number-normalize',
  PARSE_URL = 'parse-url',
  DATE_FORMAT = 'date-format',
}

export type PipeConfig =
  | RegexReplacePipeConfig
  | NumberNormalizePipeConfig
  | ParseUrlPipeConfig
  | DateFormatPipeConfig;
