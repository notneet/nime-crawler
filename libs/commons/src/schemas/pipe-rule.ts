import { Exclude } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CleanerType } from './cleaner-type';

export abstract class PipeRule<T = string> {
  @IsString()
  @IsNotEmpty()
  @IsEnum(CleanerType)
  type: CleanerType | string;

  @Exclude({ toPlainOnly: true })
  baseUrl?: string;

  abstract exec(val: T): any;

  reverse(val: any) {
    return val;
  }
}
