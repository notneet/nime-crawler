import { Exclude, Expose } from 'class-transformer';
import { UserRoles, Users } from '../entities/user.entity';

export class UsersDto implements Users {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Exclude()
  password: string;

  @Expose()
  role: UserRoles;

  @Expose()
  n_status: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  deleted_at: Date;
}
