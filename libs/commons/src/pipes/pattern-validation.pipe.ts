import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreatePostDetailPatternDto } from '../dto/create/create-post-detail-pattern.dto';
import { CreatePostPatternDto } from '../dto/create/create-post-pattern.dto';

type ValidationType = CreatePostPatternDto | CreatePostDetailPatternDto;

@Injectable()
export class PatternValidationPipe implements PipeTransform {
  transform(value: ValidationType, metadata: ArgumentMetadata) {
    return;
  }
}
