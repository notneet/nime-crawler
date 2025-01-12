import { Injectable } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { DateTime } from 'luxon';
import { BasePipe } from './pipes-abstract.service';
import { DateFormatPipeConfig } from './types/date-format.type';

@Injectable()
export class DateFormatPipe extends BasePipe {
  execute(value: string, config: DateFormatPipeConfig): string {
    if (isEmpty(value)) return new Date().toISOString();

    return DateTime.fromFormat(value, config.format)
      .setZone(config.options.timezone)
      .toString();
  }
}
