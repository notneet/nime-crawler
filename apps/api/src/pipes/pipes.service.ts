import { Injectable } from '@nestjs/common';
import { PageDto } from '../dtos/pagination.dto';
import { Pipe, RegisteredPipes } from './entities/pipe.entity';

@Injectable()
export class PipesService {
  findAll(): PageDto<Pipe[] | null> {
    return {
      data: RegisteredPipes,
    };
  }

  findOne(id: number): PageDto<Pipe | null> {
    return {
      data: RegisteredPipes.find((pipe) => pipe.id === id) || null,
    };
  }
}
