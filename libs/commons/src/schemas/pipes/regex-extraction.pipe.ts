import { IsNotEmpty, IsString, isArray } from 'class-validator';
import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class RegexExtractionPipe extends PipeRule {
  type: CleanerType.REGEX_EXTRACTION;

  @IsString()
  @IsNotEmpty()
  regex: string;

  @IsString({ each: true })
  @IsNotEmpty()
  flag: string;

  exec(val: string) {
    if (isArray(val)) return val;

    const flag = Array.isArray(this.flag) ? this.flag.join(',') : this.flag;
    const match = val?.match(new RegExp(this.regex, flag));

    return (match || []).shift();
  }
}
