import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stream } from '@libs/commons/entities/stream.entity';
import { WatchModule } from '../watch/watch.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stream]), WatchModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
