import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class PatternValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    try {
      if (Array.isArray(value)) {
        // Array.isArray(JSON.parse(value))
        return JSON.stringify(value);
      }
      throw new BadRequestException('Pattern must be an array');
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Pattern invalid');
    }
  }
}
