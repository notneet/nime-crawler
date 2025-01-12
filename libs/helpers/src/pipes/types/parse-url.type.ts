import { BasePipeConfig, PipeName } from './pipe.type';

export interface ParseUrlPipeConfig extends BasePipeConfig {
  name: PipeName.PARSE_URL;
  options: ParseUrlPipeOptions;
}

export interface ParseUrlPipeOptions {
  protocol: string;
  domain: string;
  endpoint: string;
}
