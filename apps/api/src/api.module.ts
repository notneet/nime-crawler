import { Module, ValidationPipe } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { MediaModule } from './media/media.module';
import { AnimeSourceModule } from './anime-source/anime-source.module';
import { PostPatternModule } from './post-pattern/post-pattern.module';
import { PostPatternDetailModule } from './post-pattern-detail/post-pattern-detail.module';
import { WatchModule } from './watch/watch.module';
import { StreamModule } from './stream/stream.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvKey } from '@libs/commons/helper/constant';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      // name: EnvKey.DATABASE_URL,
      imports: [TypeOrmConfigModule.register()],
      useExisting: TypeOrmConfig,
    }),
    MediaModule,
    AnimeSourceModule,
    PostPatternModule,
    PostPatternDetailModule,
    WatchModule,
    StreamModule,
  ],
  controllers: [ApiController],
  providers: [
    ApiService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
  ],
})
export class ApiModule {}
