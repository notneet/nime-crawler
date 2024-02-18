import { Injectable } from '@nestjs/common';
import { InjectSentry, SentryService } from '@travelerdev/nestjs-sentry';
import { SystemContextType } from '../types/system-monitor.enum';

@Injectable()
export class SystemMonitorService {
  constructor(@InjectSentry() private readonly sentryClient: SentryService) {}

  /**
   * Send alert to sentry io
   * @param context Error Code
   * @param errorMessage
   */
  sendAlert(
    type: SystemContextType,
    errorMessage: string,
    trace?: string | undefined,
    context?: string | undefined,
  ) {
    if (type === 'error') {
      this.sentryClient.error(errorMessage, trace, context);
    } else {
      this.sentryClient.warn(errorMessage, context);
    }
  }
}
