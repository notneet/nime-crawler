import { GlobalExceptionFilter } from '@libs/commons/exceptions/global-exception.filter';
import { EnvKey } from '@libs/commons/helper/constant';
import { TypeOrmConfig } from '@libs/commons/typeorm-config/typeorm-config';
import { TypeOrmConfigModule } from '@libs/commons/typeorm-config/typeorm-config.module';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';
import { SentryModule } from '@travelerdev/nestjs-sentry';
import { AnimeSourceModule } from './anime-source/anime-source.module';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { AuthModule } from './auth/auth.module';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { MediaModule } from './media/media.module';
import { PostPatternDetailModule } from './post-pattern-detail/post-pattern-detail.module';
import { PostPatternModule } from './post-pattern/post-pattern.module';
import { StreamModule } from './stream/stream.module';
import { UsersModule } from './users/users.module';
import { WatchModule } from './watch/watch.module';
import { PostPatternEpisodeModule } from './post-pattern-episode/post-pattern-episode.module';

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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          throttlers: [
            {
              ttl: seconds(config.get<number>(EnvKey.RATE_LIMIT_SECOND, 10)),
              limit: config.get<number>(EnvKey.RATE_LIMIT_COUNT, 30),
            },
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
    AuthModule,
    UsersModule,
    PostPatternEpisodeModule,
  ],
  controllers: [ApiController],
  providers: [
    ApiService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
