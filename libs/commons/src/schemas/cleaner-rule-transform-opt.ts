import { TypeOptions } from 'class-transformer';
import { CleanerType } from './cleaner-type';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { MonthIDTranslator } from './pipes/month-id-translator.pipe';
import { NumberNormalizePipe } from './pipes/num-normalize.pipe';
import { ParseAsURLPipe } from './pipes/parse-as-url.pipe';
import { RegexExtractionPipe } from './pipes/regex-extraction.pipe';
import { RegexReplacePipe } from './pipes/regex-replace.pipe';

export const CleanerRuleTransOpt: TypeOptions = {
  keepDiscriminatorProperty: true,
  discriminator: {
    property: 'type',
    subTypes: [
      { name: CleanerType.NUM_NORMALIZE, value: NumberNormalizePipe },
      { name: CleanerType.PARSE_AS_URL, value: ParseAsURLPipe },
      { name: CleanerType.DATE_FORMAT, value: DateFormatPipe },
      { name: CleanerType.REGEX_REPLACE, value: RegexReplacePipe },
      { name: CleanerType.REGEX_EXTRACTION, value: RegexExtractionPipe },
      { name: CleanerType.MONTH_ID_TRANSLATOR, value: MonthIDTranslator },
    ],
  },
};
