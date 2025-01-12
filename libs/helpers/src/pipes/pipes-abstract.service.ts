import { BasePipeConfig } from './types/pipe.type';

export abstract class BasePipe {
  abstract execute(value: string, config: BasePipeConfig): string;
}
