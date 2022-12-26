import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class Media {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}
