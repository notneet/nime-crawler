import { Stream } from '@libs/commons/entities/stream.entity';
import { Watch } from '@libs/commons/entities/watch.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamModule } from '../stream/stream.module';
import { WatchController } from './watch.controller';
import { WatchService } from './watch.service';

@Module({
  imports: [TypeOrmModule.forFeature([Watch, Stream]), StreamModule],
  controllers: [WatchController],
  providers: [WatchService],
  exports: [WatchService],
})
export class WatchModule {}
