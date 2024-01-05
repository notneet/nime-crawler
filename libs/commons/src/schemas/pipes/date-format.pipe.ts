import { parseDate } from 'chrono-node';
import { IsOptional, IsString, isArray } from 'class-validator';
import { DateTime } from 'luxon';
import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class DateFormatPipe extends PipeRule {
  type: CleanerType.DATE_FORMAT;

  @IsString()
  @IsOptional()
  format: string = 'yyyy-MM-dd HH:mm:ss';

  @IsString()
  @IsOptional()
  timezone?: string = 'Asia/Jakarta';

  exec(val: string) {
    if (isArray(val)) return val;

    const parsedDate = parseDate(val, { instant: new Date(val) });

    if (!parsedDate) {
      return val;
    }

    const luxonDate = DateTime.fromJSDate(parsedDate, {
      zone: String(val).toLocaleLowerCase().endsWith('z')
        ? 'utc'
        : this.timezone,
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
