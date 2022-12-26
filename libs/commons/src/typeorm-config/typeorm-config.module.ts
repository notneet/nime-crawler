import { DynamicModule, Module } from '@nestjs/common';
import { SymDefaultConfig, SymMaxConLimit } from '../helper/constant';
import { TypeOrmConfig } from './typeorm-config';
@Module({
  providers: [TypeOrmConfig],
  exports: [TypeOrmConfig],
})
export class TypeOrmConfigModule {
  static register(defaultConfig = 'default', maxConLimit = 2): DynamicModule {
    return {
      module: TypeOrmConfigModule,
      providers: [
        { provide: SymMaxConLimit, useValue: maxConLimit },
        { provide: SymDefaultConfig, useValue: defaultConfig },
      ],
    };
  }
}
