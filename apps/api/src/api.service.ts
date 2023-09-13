import { EnvKey } from '@libs/commons/helper/constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

@Injectable()
export class ApiService {
  constructor(private readonly config: ConfigService) {}

  async getWelcome(): Promise<Record<string, any>> {
    return {
      app_name: this.config.get(EnvKey.APP_NAME),
      app_version: this.config.get(EnvKey.V1_VERSION),
      maintaner: await this.mappingMaintaners(),
    };
  }

  private async mappingMaintaners() {
    const jsonString = await readFile(`./docs/mainaners.json`, 'utf8');
    return JSON.parse(jsonString);
  }
}
