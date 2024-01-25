import { RabbitMQCtx } from '@libs/commons/types/rabbitmq-context';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AcknolageMessageInterceptor implements NestInterceptor {
  logger = new Logger(AcknolageMessageInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'rpc') {
      const contextRcp = context.switchToRpc();
      return this.ackOrRejectQueue(
        next,
        contextRcp.getContext<RabbitMQCtx>(),
        contextRcp.getData(),
      );
    } else {
      return next.handle();
    }
  }

  private ackOrRejectQueue(
    next: CallHandler<any>,
    msgContext: RabbitMQCtx,
    data: Record<string, any>,
  ) {
    const startTime = new Date();
    const msg = msgContext.getMessage();

    const ackOrReject = (isReject: boolean) => {
      const endDate = new Date();
      const diffDate = (endDate.getTime() - startTime.getTime()) / 1000;
      try {
        if (isReject) {
          msgContext.getChannelRef().reject(msg, false);
        } else {
          msgContext.getChannelRef().ack(msg);
        }
      } catch (error) {
        if (
          error.name === 'IllegalOperationError' &&
          error.message === 'Channel closed'
        ) {
          this.logger.error('connection lost');
        }
      }
      this.logger.debug(
        `exectime ${diffDate}s ${data?.endPoint || data?.pageUrl}`,
      );
    };
    return next.handle().pipe(tap(ackOrReject));
  }
}
