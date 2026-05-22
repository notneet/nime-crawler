import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

interface JobLike {
  source?: string;
  stage?: string;
  url?: string;
}

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const label = `${context.getClass().name}.${context.getHandler().name}`;
    const job = context.getArgByIndex<JobLike | undefined>(0);
    const tag = job?.source ? `${job.source}/${job.stage ?? '?'} ${job.url ?? ''}`.trim() : label;

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${tag} took ${Date.now() - start}ms`),
        error: () => this.logger.error(`${tag} failed after ${Date.now() - start}ms`),
      }),
    );
  }
}
