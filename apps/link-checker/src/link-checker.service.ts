import { Injectable } from '@nestjs/common';

@Injectable()
export class LinkCheckerService {
  getHello(): string {
    return 'Hello World!';
  }
}
