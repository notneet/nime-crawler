import { Injectable } from '@nestjs/common';

@Injectable()
export class ReadAnimeSourceService {
  getHello(): string {
    return 'Hello World!';
  }
}
