import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';
import { BrowserActionModule } from '@hanivanrizky/nestjs-browser-action';
import { EngineService } from './engine.service';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({ maxRetries: 3, logLevel: ['error', 'warn'] }),
    BrowserActionModule.forRoot({ pool: { min: 1, max: 4 }, cookies: { enabled: false } }),
  ],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
