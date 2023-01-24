import { Module } from '@nestjs/common';
import { WatchService } from './watch.service';
import { WatchController } from './watch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watch } from '@libs/commons/entities/watch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Watch])],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
