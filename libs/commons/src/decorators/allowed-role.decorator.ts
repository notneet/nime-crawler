import { SetMetadata } from '@nestjs/common';

export type ROLES = 'admin' | 'user';

export const AllowedUserRoles = (roles: ROLES[]) => {
  return SetMetadata('roles', roles);
};
