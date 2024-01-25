import { parseDate } from 'chrono-node';
import { IsOptional, IsString, isArray } from 'class-validator';
import { DateTime } from 'luxon';
import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class DateFormatPipe extends PipeRule {
  type: CleanerType.DATE_FORMAT;

  @IsString()
  @IsOptional()
  format: string = 'YYYY-MM-dd hh:mm:ss';

  @IsString()
  @IsOptional()
  timezone?: string = 'Asia/Jakarta';

  exec(val: string) {
    if (isArray(val) || val?.search(/^https?:\/\//) === 0) return val;

    const parsedDate = parseDate(val, { instant: new Date(val) });

    if (!parsedDate) {
      return val;
    }

    const luxonDate = DateTime.fromJSDate(parsedDate, {
      zone: this.timezone,
    });

    return luxonDate.toSeconds();
  }

  reverse(val: any) {
    if (isNaN(Number(val))) {
      return val;
    }

    return DateTime.fromSeconds(val).toFormat(this.format);
  }
}
