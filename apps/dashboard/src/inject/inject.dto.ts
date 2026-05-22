import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class InjectDto {
  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsString()
  @IsNotEmpty()
  stage!: string;

  @IsUrl({ require_protocol: true })
  url!: string;
}
