import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  @IsOptional()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  url: string;
}
