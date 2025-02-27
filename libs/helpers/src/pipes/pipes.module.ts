import { Module } from '@nestjs/common';
import { DateFormatPipe } from './date-format.pipe';
import { NumberNormalizePipe } from './number-normalize.pipe';
import { ParseUrlPipe } from './parse-url.pipe';
import { PipesService } from './pipes.service';
import { RegexReplacePipe } from './regex-replace.pipe';

@Module({
  providers: [
    PipesService,
    NumberNormalizePipe,
    ParseUrlPipe,
    RegexReplacePipe,
    DateFormatPipe,
  ],
  exports: [PipesService],
})
export class PipesModule {}
