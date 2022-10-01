import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { PrismaModule } from '@libs/commons/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
