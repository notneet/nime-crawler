import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMediaDto {
  @IsOptional()
  id: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  url: string;
}
