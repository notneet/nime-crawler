import { IsIn, IsString, IsUrl } from 'class-validator';

export class AiPatternFetchDto {
  @IsUrl({ require_protocol: true })
  url!: string;

  @IsIn(['xpath', 'browser'])
  fetchMode!: 'xpath' | 'browser';
}

export class AiPatternDto {
  @IsString()
  html!: string;

  @IsString()
  stage!: string;

  @IsIn(['xpath', 'browser'])
  fetchMode!: 'xpath' | 'browser';
}
