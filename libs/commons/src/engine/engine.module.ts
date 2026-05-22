import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';
import { BrowserActionModule } from '@hanivanrizky/nestjs-browser-action';
import { EngineService } from './engine.service';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({ maxRetries: 3, logLevel: ['error', 'warn'] }),
    BrowserActionModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pool: { min: 1, max: 4 },
        cookies: { enabled: false },
        launchOptions: {
          headless: config.get<string>('BROWSER_HEADLESS') !== 'false',
          // Heavy episode workflow (reveal + 6 mirror clicks/waits) can outrun the
          // default 30s protocol timeout, surfacing "callFunctionOn timed out".
          protocolTimeout: 120_000,
        },
      }),
    }),
  ],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
