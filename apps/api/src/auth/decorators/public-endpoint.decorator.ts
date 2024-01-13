import { SetMetadata } from '@nestjs/common';

export const PublicEndpoint = (val: boolean = true) =>
  SetMetadata('isPublicEndpoint', val);
