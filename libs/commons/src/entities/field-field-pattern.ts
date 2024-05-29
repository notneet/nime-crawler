import { Type } from 'class-transformer';
import { CleanerRuleTransOpt } from '../schemas/cleaner-rule-transform-opt';
import { PipeRule } from '../schemas/pipe-rule';
import { DateFormatPipe } from '../schemas/pipes/date-format.pipe';
import { MonthIDTranslator } from '../schemas/pipes/month-id-translator.pipe';
import { NumberNormalizePipe } from '../schemas/pipes/num-normalize.pipe';
import { ParseAsURLPipe } from '../schemas/pipes/parse-as-url.pipe';
import { RegexExtractionPipe } from '../schemas/pipes/regex-extraction.pipe';
import { RegexReplacePipe } from '../schemas/pipes/regex-replace.pipe';

export type CleanerTypeRules = Array<
  | NumberNormalizePipe
  | ParseAsURLPipe
  | DateFormatPipe
  | RegexReplacePipe
  | RegexExtractionPipe
  | MonthIDTranslator
>;

export class FieldPipeOptionsPattern {
  alt_pattern: string;
  batch_in_detail: boolean;
  mix_with_container: boolean; // for now only work in batch
}

export class FieldPipePattern {
  key: string;
  pattern: string;
  result_type: string;
  @Type(() => FieldPipeOptionsPattern)
  options: FieldPipeOptionsPattern;
  @Type(() => PipeRule, CleanerRuleTransOpt)
  pipes?: CleanerTypeRules;
}
