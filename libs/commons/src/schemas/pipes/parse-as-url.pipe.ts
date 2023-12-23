import { CleanerType } from '../cleaner-type';
import { PipeRule } from '../pipe-rule';

export class ParseAsURLPipe extends PipeRule {
  type: CleanerType.PARSE_AS_URL;

  exec(url: string): string {
    if (typeof url === 'string') {
      return new URL(url, this.baseUrl).toString();
    }

    return url;
  }
}
