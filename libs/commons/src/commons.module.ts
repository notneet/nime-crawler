import { Module } from '@nestjs/common';
import { CommonsService } from './commons.service';
import { PrismaModule } from './prisma/prisma.module';
import { TypeormConfigModule } from './typeorm-config/typeorm-config.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [PrismaModule, TypeormConfigModule],
})
export class CommonsModule {}
