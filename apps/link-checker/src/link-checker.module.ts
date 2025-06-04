import { Module } from '@nestjs/common';
import { LinkCheckerController } from './link-checker.controller';
import { LinkCheckerService } from './link-checker.service';

@Module({
  imports: [],
  controllers: [LinkCheckerController],
  providers: [LinkCheckerService],
})
export class LinkCheckerModule {}
