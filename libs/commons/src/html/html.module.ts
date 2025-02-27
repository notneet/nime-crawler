import { PipesModule } from '@helpers/pipes/pipes.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HtmlService } from './html.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule, PipesModule],
  providers: [HtmlService],
  exports: [HtmlService],
})
export class HtmlModule {}
