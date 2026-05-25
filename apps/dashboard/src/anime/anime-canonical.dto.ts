import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class AnimeCanonicalDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  canonicalId!: number;
}
