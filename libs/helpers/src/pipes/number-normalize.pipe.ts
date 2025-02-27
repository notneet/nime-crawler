import { Injectable } from '@nestjs/common';
import { BasePipe } from './pipes-abstract.service';

@Injectable()
export class NumberNormalizePipe extends BasePipe {
  execute(value: string): string {
    const num = value.toLowerCase();
    if (num.endsWith('k')) return (parseFloat(num) * 1000).toString();
    if (num.endsWith('m')) return (parseFloat(num) * 1000000).toString();

    return value;
  }
}
