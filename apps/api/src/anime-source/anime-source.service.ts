import { CreateAnimeSourceDto } from '@libs/commons/dto/create/create-anime-source.dto';
import { UpdateAnimeSourceDto } from '@libs/commons/dto/update/update-anime-source.dto';
import { AnimeSource } from '@libs/commons/entities/anime-source.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AnimeSourceService {
  constructor(
    @InjectRepository(AnimeSource)
    private readonly conAnimeSource: Repository<AnimeSource>,
  ) {}

  async create(createAnimeSourceDto: CreateAnimeSourceDto) {
    try {
      let animeSource = await this.findByUrl(createAnimeSourceDto.url);

      if (!animeSource) {
        animeSource = this.conAnimeSource.create(createAnimeSourceDto);
        return this.conAnimeSource.insert(animeSource);
      }

      Object.assign(animeSource, createAnimeSourceDto);
      return this.conAnimeSource.update({ id: animeSource.id }, animeSource);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll() {
    try {
      return this.conAnimeSource.find();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrl(urlSource: string) {
    try {
      return this.conAnimeSource.findOne({ where: { url: urlSource } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByNStatus(nStatus = 1) {
    try {
      return this.conAnimeSource.find({ where: { n_status: nStatus } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByIntervalsAndGroup() {
    try {
      const listInterval = await this.conAnimeSource
        .createQueryBuilder(`q`)
        .where(`q.n_status = 1`)
        .groupBy('q.interval')
        .getMany();
      return listInterval.map((it) => it.interval);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByIntervalAndLastId(interval: number, lastId: number) {
    try {
      return this.conAnimeSource
        .createQueryBuilder(`q`)
        .where(`q.interval = :interval`, { interval })
        .andWhere('q.id > :lastId', { lastId })
        .andWhere('q.n_status = 1')
        .limit(15)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async validate(id: number, nStatus: number) {
    try {
      const isAvailable = await this.findOne(id);

      if (!isAvailable) throw new NotFoundException('data not found');
      isAvailable.n_status = nStatus;

      return this.conAnimeSource.save(isAvailable);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      return this.conAnimeSource.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, updateAnimeSourceDto: UpdateAnimeSourceDto) {
    try {
      const animeSource = await this.findOne(id);

      if (!animeSource) throw new NotFoundException('data not found');
      Object.assign(animeSource, updateAnimeSourceDto);

      return this.conAnimeSource.update({ id }, animeSource);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const animeSource = await this.findOne(id);

      if (!animeSource) throw new NotFoundException('data not found');

      return this.conAnimeSource.remove(animeSource);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
