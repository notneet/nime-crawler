import { GlobalExceptionFilter } from '@libs/commons/exceptions/global-exception.filter';
import { EnvKey } from '@libs/commons/helper/constant';
import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';
import { SentryModule } from '@travelerdev/nestjs-sentry';
import { AnimeSourceModule } from './anime-source/anime-source.module';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { MediaModule } from './media/media.module';
import { PostPatternDetailModule } from './post-pattern-detail/post-pattern-detail.module';
import { PostPatternModule } from './post-pattern/post-pattern.module';
import { StreamModule } from './stream/stream.module';
import { WatchModule } from './watch/watch.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      // name: EnvKey.DATABASE_URL,
      imports: [TypeOrmConfigModule.register()],
      useExisting: TypeOrmConfig,
    }),
    SentryModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          dsn: config.get<string>(EnvKey.SENTRY_DSN),
          debug:
            config.get<string>(EnvKey.APP_ENV) === 'development' ? true : false,
          tracesSampleRate: 1.0,
          integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // new ProfilingIntegration(),
          ],
        };
      },
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
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class ApiModule {}
