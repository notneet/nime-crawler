import { ROLES } from '@libs/commons/decorators/allowed-role.decorator';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndMerge<ROLES[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles?.length === 0) {
      // No roles are specified, so access is allowed.
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user || !user?.role) {
      // If there is no user or no role in the user object, deny access.
      return false;
    }

    console.log(requiredRoles, user?.role);

    return requiredRoles?.includes(user.role);
  }
}
