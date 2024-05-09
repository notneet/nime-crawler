import { Module } from '@nestjs/common';
import { StringHelperService } from './string-helper.service';

@Module({
  providers: [StringHelperService],
  exports: [StringHelperService],
})
export class StringHelperModule {}
