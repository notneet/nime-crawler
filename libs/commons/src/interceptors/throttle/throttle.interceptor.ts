import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { from, Observable, switchMap } from 'rxjs';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Pre-handle throttle: sleep before processing each consumed message so the
// worker paces itself against target sites. With prefetchCount: 1 this is a
// real gap between payloads. CONSUME_DELAY_MS=0 disables it.
@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Throttle');
  private readonly delayMs: number;

  constructor(config: ConfigService) {
    this.delayMs = Number(config.get<string>('CONSUME_DELAY_MS', '1000'));
    if (this.delayMs > 0) this.logger.log(`consume delay ${this.delayMs}ms`);
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!(this.delayMs > 0)) return next.handle();
    return from(sleep(this.delayMs)).pipe(switchMap(() => next.handle()));
  }
}
