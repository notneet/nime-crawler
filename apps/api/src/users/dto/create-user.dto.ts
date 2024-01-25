import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { UserRoles } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRoles)
  @IsNotEmpty()
  role: UserRoles;

  @IsNumber()
  @IsNotEmpty()
  n_status: number;
}
