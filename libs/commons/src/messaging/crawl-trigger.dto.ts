import { IsString } from 'class-validator';

export class CrawlTriggerDto {
  @IsString()
  source!: string;
}
