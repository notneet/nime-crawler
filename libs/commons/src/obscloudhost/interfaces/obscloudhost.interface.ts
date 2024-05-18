import { FactoryProvider, ModuleMetadata } from '@nestjs/common';

export interface ObsCloudhostOptions {
  endpointUrl: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  useSecure?: boolean;
}

export type ObsCloudhostAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<ObsCloudhostOptions>, 'useFactory' | 'inject'>;
