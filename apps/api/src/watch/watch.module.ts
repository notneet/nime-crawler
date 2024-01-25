import { Watch } from '@libs/commons/entities/watch.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';

@Module({
  imports: [TypeOrmModule.forFeature([Watch])],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
