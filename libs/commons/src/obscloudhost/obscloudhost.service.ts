import { Inject, Injectable, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { Client } from 'minio';
import { OBS_HELPER_SYM } from './constant';
import { ObsCloudhostOptions } from './interfaces/obscloudhost.interface';

@Injectable()
export class ObscloudhostService {
  private readonly logger = new Logger(ObscloudhostService.name);
  private readonly client: Client;

  constructor(@Inject(OBS_HELPER_SYM) private options: ObsCloudhostOptions) {
    if (isEmpty(options?.useSecure)) options.useSecure = true;

    this.client = new Client({
      endPoint: options?.endpointUrl,
      accessKey: options?.accessKey,
      secretKey: options?.secretKey,
      useSSL: options?.useSecure,
    });
  }

  async getFile(path: string) {
    if (isEmpty(path)) throw new Error('path cannot be empty!');

    console.log(path, 'path');

    try {
      const fileResult = await this.client.getObject(
        this.options.bucketName,
        path,
      );
      return fileResult;
    } catch (error) {
      this.logger.error(`error get object: ${error?.message}`);
    }
  }
}
