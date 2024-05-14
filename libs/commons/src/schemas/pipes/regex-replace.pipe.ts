import { IsNotEmpty, IsString } from 'class-validator';
import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class RegexReplacePipe extends PipeRule {
  type: CleanerType.REGEX_REPLACE;

  @IsString()
  @IsNotEmpty()
  regex: string;

  @IsString({ each: true })
  @IsNotEmpty()
  scope: string;

  @IsString()
  textReplacement: string;

  exec(val: string) {
    if (typeof val === 'string') {
      const flag = Array.isArray(this.scope)
        ? this.scope.join(',')
        : this.scope;
      const result = val.replace(
        new RegExp(this.regex, flag),
        this.textReplacement,
      ) as string;

      return result;
    } else {
      return val;
    }
  }
}
