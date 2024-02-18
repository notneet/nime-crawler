import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { SentryModule } from '@travelerdev/nestjs-sentry';
import { EnvKey } from '../helper/constant';
import { SystemMonitorService } from './system-monitor.service';

@Module({
  imports: [
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
  ],
  providers: [SystemMonitorService],
  exports: [SystemMonitorService],
})
export class SystemMonitorModule {}
