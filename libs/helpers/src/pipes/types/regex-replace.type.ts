import { BasePipeConfig, PipeName } from './pipe.type';

export interface RegexReplacePipeConfig extends BasePipeConfig {
  name: PipeName.REGEX_REPLACE;
  search: string;
  replace: string;
  options: RegexReplacePipeOptions;
}

export interface RegexReplacePipeOptions {
  flags: string;
}
