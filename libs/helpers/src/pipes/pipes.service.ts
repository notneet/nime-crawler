import { Injectable } from '@nestjs/common';
import { arrayNotEmpty, isEmpty } from 'class-validator';
import { DateFormatPipe } from './date-format.pipe';
import { NumberNormalizePipe } from './number-normalize.pipe';
import { ParseUrlPipe } from './parse-url.pipe';
import { BasePipe } from './pipes-abstract.service';
import { RegexReplacePipe } from './regex-replace.pipe';
import { PipeConfig, PipeName } from './types/pipe.type';

@Injectable()
export class PipesService {
  private pipes: Map<string, BasePipe> = new Map();

  constructor(
    private readonly regexReplacePipe: RegexReplacePipe,
    private readonly numberNormalizePipe: NumberNormalizePipe,
    private readonly dateFormatPipe: DateFormatPipe,
    private readonly parseUrlPipe: ParseUrlPipe,
  ) {
    this.registerDefaultPipes();
  }

  private registerDefaultPipes(): void {
    this.pipes.set(PipeName.REGEX_REPLACE, this.regexReplacePipe);
    this.pipes.set(PipeName.NUMBER_NORMALIZE, this.numberNormalizePipe);
    this.pipes.set(PipeName.DATE_FORMAT, this.dateFormatPipe);
    this.pipes.set(PipeName.PARSE_URL, this.parseUrlPipe);
  }

  normalize(value: string, pipes: PipeConfig[]): string {
    if (isEmpty(value) || !arrayNotEmpty(pipes)) return value;

    return pipes.reduce((result, pipeConfig) => {
      const pipe = this.pipes.get(pipeConfig.name);
      return pipe ? pipe.execute(result, pipeConfig) : result;
    }, value);
  }

  registerPipe(name: string, pipe: BasePipe): void {
    this.pipes.set(name, pipe);
  }
}
