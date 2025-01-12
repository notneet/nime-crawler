import { BasePipeConfig, PipeName } from './pipe.type';

export interface DateFormatPipeConfig extends BasePipeConfig {
  name: PipeName.DATE_FORMAT;
  format: string;
  options: DateFormatPipeOptions;
}

export interface DateFormatPipeOptions {
  timezone: string;
}
