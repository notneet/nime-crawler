import { Type } from 'class-transformer';
import { CleanerRuleTransOpt } from '../schemas/cleaner-rule-transform-opt';
import { PipeRule } from '../schemas/pipe-rule';
import { DateFormatPipe } from '../schemas/pipes/date-format.pipe';
import { NumberNormalizePipe } from '../schemas/pipes/num-normalize.pipe';
import { ParseAsURLPipe } from '../schemas/pipes/parse-as-url.pipe';

export type CleanerTypeRules = Array<
  NumberNormalizePipe | ParseAsURLPipe | DateFormatPipe
>;

export class FieldPipePattern {
  key: string;
  pattern: string;
  result_type: string;
  @Type(() => PipeRule, CleanerRuleTransOpt)
  pipes?: CleanerTypeRules;
}
