import { Module } from '@nestjs/common';
import { CommonsService } from './commons.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [PrismaModule],
})
export class CommonsModule {}
