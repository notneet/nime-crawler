import { Injectable } from '@nestjs/common';
import { BasePipe } from './pipes-abstract.service';
import { ParseUrlPipeConfig } from './types/parse-url.type';

@Injectable()
export class ParseUrlPipe extends BasePipe {
  execute(value: string, config: ParseUrlPipeConfig): string {
    const {
      protocol = 'https',
      domain = '',
      endpoint = '',
    } = config.options || {};
    const baseUrl = new URL(`${protocol}://${domain}`);
    baseUrl.pathname = `${endpoint}${value}`;

    return baseUrl.toString();
  }
}
