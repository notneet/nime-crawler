import { DynamicModule, Module } from '@nestjs/common';
import { OBS_HELPER_SYM } from './constant';
import {
  ObsCloudhostAsyncOptions,
  ObsCloudhostOptions,
} from './interfaces/obscloudhost.interface';
import { ObscloudhostService } from './obscloudhost.service';

@Module({
  providers: [ObscloudhostService],
  exports: [ObscloudhostService],
})
export class ObscloudhostModule {
  static register(options: ObsCloudhostOptions): DynamicModule {
    const mergedOptions: ObsCloudhostOptions = {
      ...options,
      useSecure: false,
    };

    return {
      module: ObscloudhostModule,
      providers: [
        {
          provide: OBS_HELPER_SYM,
          useValue: mergedOptions,
        },
        ObscloudhostService,
      ],
      exports: [ObscloudhostService],
    };
  }

  static registerAsync(options: ObsCloudhostAsyncOptions): DynamicModule {
    return {
      module: ObscloudhostModule,
      providers: [
        {
          provide: OBS_HELPER_SYM,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        ObscloudhostService,
      ],
      exports: [ObscloudhostService],
    };
  }
}
