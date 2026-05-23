import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Adapter } from '@libs/commons/entities';
import { AdapterController } from './adapter.controller';
import { AdapterAdminService } from './adapter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Adapter])],
  controllers: [AdapterController],
  providers: [AdapterAdminService],
})
export class AdapterModule {}
