import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimeSource } from '../../../libs/commons/src/entities/anime-source.entity';

@Injectable()
export class CronIntervalService {
  // constructor(
  //   @InjectRepository(AnimeSource)
  //   private readonly animeSourceRepo: Repository<AnimeSource>,
  // ) {}

  // getAllAnimeResource() {
  //   return this.animeSourceRepo.find();
  // }

  getHello(): string {
    return 'Hello World!';
  }
}
