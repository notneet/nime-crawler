import { Injectable } from '@nestjs/common';

@Injectable()
export class ScraperStreamService {
  getHello(): string {
    return 'Hello World!';
  }
}
