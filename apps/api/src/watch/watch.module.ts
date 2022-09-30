import { Module } from '@nestjs/common';
import { WatchService } from './watch.service';
import { WatchController } from './watch.controller';
import { PrismaModule } from '@libs/commons/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
