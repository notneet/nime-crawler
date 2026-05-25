import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Adapter } from '@libs/commons/entities';
import { EngineModule } from '@libs/commons';
import { AdapterController } from './adapter.controller';
import { AdapterAdminService } from './adapter.service';
import { AiPatternService } from './ai-pattern.service';

@Module({
  imports: [TypeOrmModule.forFeature([Adapter]), EngineModule],
  controllers: [AdapterController],
  providers: [AdapterAdminService, AiPatternService],
})
export class AdapterModule {}
