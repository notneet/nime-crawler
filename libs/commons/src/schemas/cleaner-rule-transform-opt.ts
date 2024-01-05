import { TypeOptions } from 'class-transformer';
import { CleanerType } from './cleaner-type';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { NumberNormalizePipe } from './pipes/num-normalize.pipe';
import { ParseAsURLPipe } from './pipes/parse-as-url.pipe';

export const CleanerRuleTransOpt: TypeOptions = {
  keepDiscriminatorProperty: true,
  discriminator: {
    property: 'type',
    subTypes: [
      { name: CleanerType.NUM_NORMALIZE, value: NumberNormalizePipe },
      { name: CleanerType.PARSE_AS_URL, value: ParseAsURLPipe },
      { name: CleanerType.DATE_FORMAT, value: DateFormatPipe },
    ],
  },
};
