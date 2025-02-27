import { Envs } from '@commons/env';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserService } from './browser.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          baseURL: configService.get<string>(Envs.BROWSER_URL, ''),
        };
      },
    }),
  ],
  providers: [BrowserService],
  exports: [BrowserService],
})
export class BrowserModule {}
