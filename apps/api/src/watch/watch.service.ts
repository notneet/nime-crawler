import { Injectable } from '@nestjs/common';
import { CreateWatchDto } from './dto/create-watch.dto';
import { UpdateWatchDto } from './dto/update-watch.dto';

@Injectable()
export class WatchService {
  create(createWatchDto: CreateWatchDto) {
    return 'This action adds a new watch';
  }

  findAll() {
    return `This action returns all watch`;
  }

  findOne(id: number) {
    return `This action returns a #${id} watch`;
  }

  update(id: number, updateWatchDto: UpdateWatchDto) {
    return `This action updates a #${id} watch`;
  }

  remove(id: number) {
    return `This action removes a #${id} watch`;
  }
}
