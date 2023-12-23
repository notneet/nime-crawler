import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class NumberNormalizePipe extends PipeRule {
  type: CleanerType.NUM_NORMALIZE;

  exec(numString: string): number {
    if (typeof numString !== 'string') {
      return numString;
    }

    const val = numString?.toLowerCase()?.replace(new RegExp(',', 'g'), '.');
    let resVal = parseFloat(val as string);

    if (val?.endsWith('k') || val?.endsWith('rb')) {
      resVal *= 1000;
    } else if (val?.endsWith('m')) {
      resVal *= 1000000;
    }
    if (isNaN(resVal)) {
      return 0;
    }

    return Math.round(resVal);
  }
}
