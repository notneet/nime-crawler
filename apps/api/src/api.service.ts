import { EnvKey } from '@libs/commons/helper/constant';
import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectSentry, SentryService } from '@travelerdev/nestjs-sentry';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

@Injectable()
export class ApiService {
  constructor(
    private readonly config: ConfigService,
    @InjectSentry() private readonly sentryClient: SentryService,
  ) {
    // sentryClient.instance().addBreadcrumb({
    //   level: Severity.Debug,
    //   message: 'How to use native breadcrumb',
    //   data: { context: 'WhatEver' },
    // });
    // sentryClient.debug('AppService Debug', 'context');
    // sentryClient.log('AppSevice Loaded', 'test', true); // creates log asBreadcrumb //
  }

  async testSentry(options: string) {
    // if (options === 'error') {
    //   this.sentryClient.error(
    //     `Test Error Again ${DateTime.now().toUnixInteger()}`,
    //   );
    // } else {
    //   this.sentryClient.debug(
    //     `Test Debug Again ${DateTime.now().toUnixInteger()}`,
    //   );
    // }

    // return options;
    throw new MethodNotAllowedException();
  }

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
