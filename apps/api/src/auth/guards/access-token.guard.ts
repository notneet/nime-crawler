import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublicEndpoint = this.reflector.getAllAndOverride(
      'isPublicEndpoint',
      [context.getHandler(), context.getClass()],
    );
    if (isPublicEndpoint) return true;

    return super.canActivate(context);
  }
}
