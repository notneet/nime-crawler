import { IsBoolean } from 'class-validator';

export class ValidatePostPatternDto {
  @IsBoolean()
  n_status: boolean;
}
