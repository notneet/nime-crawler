import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizeUrlPipe implements PipeTransform<string, string> {
  constructor(private readonly baseUrl: string) {}

  transform(value: string): string {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('url must not be empty');
    }
    return new URL(trimmed, this.baseUrl).toString();
  }
}
