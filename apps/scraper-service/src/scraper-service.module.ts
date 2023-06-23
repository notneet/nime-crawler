import { Module } from '@nestjs/common';
import { ScraperServiceController } from './scraper-service.controller';
import { ScraperServiceService } from './scraper-service.service';
import { ReadAnimeModule } from './read-anime/read-anime.module';
import { ReadAnimePostModule } from './read-anime-post/read-anime-post.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      // name: EnvKey.DATABASE_URL,
      imports: [TypeOrmConfigModule.register()],
      useExisting: TypeOrmConfig,
    }),
    ReadAnimeModule,
    ReadAnimePostModule,
  ],
<<<<<<< HEAD
  // controllers: [ScraperServiceController],
  // providers: [ScraperServiceService],
=======
  controllers: [ScraperServiceController],
  providers: [ScraperServiceService],
>>>>>>> 52cdb53cedd47ffb12ab82f4aee89182589ecf85
})
export class ScraperServiceModule {}
