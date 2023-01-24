import { IsBoolean } from 'class-validator';

export class ValidatePatternDto {
  @IsBoolean()
  n_status: boolean;
}
