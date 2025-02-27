import { Injectable } from '@nestjs/common';
import { BasePipe } from './pipes-abstract.service';
import { RegexReplacePipeConfig } from './types/regex-replace.type';

@Injectable()
export class RegexReplacePipe extends BasePipe {
  execute(value: string, config: RegexReplacePipeConfig): string {
    const regex = new RegExp(config.search, config.options.flags);

    return value.replace(regex, config.replace);
  }
}
