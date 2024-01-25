import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimeSourceModule } from 'apps/api/src/anime-source/anime-source.module';
import { MediaModule } from 'apps/api/src/media/media.module';
import { MediaUpdaterService } from './media-updater.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmConfigModule.register()],
      useExisting: TypeOrmConfig,
    }),
    MediaModule,
    AnimeSourceModule,
  ],
  providers: [MediaUpdaterService],
})
export class MediaUpdaterModule {}
