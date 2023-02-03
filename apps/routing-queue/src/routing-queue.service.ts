import { Injectable } from '@nestjs/common';

@Injectable()
export class RoutingQueueService {
  getHello(): string {
    return 'Hello World!';
  }
}
