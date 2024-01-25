import { Injectable } from '@nestjs/common';

@Injectable()
export class ScraperServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
