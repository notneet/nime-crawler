import { Module } from '@nestjs/common';
import { AnimeSourceService } from './anime-source.service';
import { AnimeSourceController } from './anime-source.controller';
import { PrismaModule } from '@libs/commons/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnimeSourceController],
  providers: [AnimeSourceService],
  exports: [AnimeSourceService],
})
export class AnimeSourceModule {}
