import { arrayNotEmpty, isArray, isEmpty } from 'class-validator';
import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class MonthIDTranslator extends PipeRule {
  type: CleanerType.MONTH_ID_TRANSLATOR;

  private readonly indonesianMonths = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  private readonly englishMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  exec(val: string) {
    if (isArray(val) || isEmpty(val)) return val;

    this.indonesianMonths.map((it, i) => {
      const month = val.match(new RegExp(/\b[a-zA-Z]+\b/, 'g'));

      if (arrayNotEmpty(month) && it.includes(month?.shift() || '')) {
        val = val.replace(
          new RegExp(/\b[a-zA-Z]+\b/, 'g'),
          this.englishMonths[i],
        );
      }
    });

    return val;
  }
}
