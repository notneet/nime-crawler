import { Module } from '@nestjs/common';
import { HelpersService } from './helpers.service';
import { RabbitmqPopulatorModule } from './rabbitmq-populator/rabbitmq-populator.module';
import { DatabaseModule } from './database/database.module';
import { PipesModule } from './pipes/pipes.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { BrowserModule } from './browser/browser.module';

@Module({
  providers: [HelpersService],
  exports: [HelpersService],
  imports: [RabbitmqPopulatorModule, DatabaseModule, PipesModule, RabbitmqModule, BrowserModule],
})
export class HelpersModule {}
