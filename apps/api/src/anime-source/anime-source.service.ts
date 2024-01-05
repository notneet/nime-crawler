import { AnimeSourceDto } from '@libs/commons/dto/anime-souce.dto';
import { CreateAnimeSourceDto } from '@libs/commons/dto/create/create-anime-source.dto';
import { UpdateAnimeSourceDto } from '@libs/commons/dto/update/update-anime-source.dto';
import { AnimeSource } from '@libs/commons/entities/anime-source.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

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

  async findAll(
    pageOptDto: PageOptionsDto,
  ): Promise<PageDto<AnimeSourceDto[]>> {
    try {
      const data = await this.conAnimeSource
        .createQueryBuilder(`q`)
        .orderBy('q.updated_at', pageOptDto.order)
        .skip(pageOptDto?.skip)
        .take(pageOptDto?.take)
        .getMany();
      const itemCount = +(
        await this.conAnimeSource
          .createQueryBuilder(`q`)
          .orderBy('q.updated_at', pageOptDto?.order)
          .addSelect('COUNT(q.id)', 'animeSourceCount')
          .getRawOne()
      )?.animeSourceCount;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data: plainToInstance(AnimeSourceDto, data),
        meta: pageMetaDto,
      };
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

  async findByMediaId(id: number): Promise<PageDto<AnimeSourceDto[]>> {
    const data = await this.conAnimeSource
      .createQueryBuilder(`q`)
      .where(`q.id = :id`, { id })
      .getMany();

    return {
      data: plainToInstance(AnimeSourceDto, data),
    };
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
      const { data: isAvailable } = await this.findOne(id);
      if (!isAvailable) throw new NotFoundException('data not found');
      isAvailable.n_status = nStatus;
      return this.conAnimeSource.save(
        plainToInstance(AnimeSource, isAvailable),
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number): Promise<PageDto<AnimeSourceDto>> {
    let animeSource: AnimeSource | null;
    try {
      animeSource = await this.conAnimeSource
        .createQueryBuilder(`q`)
        .where({ id } as Partial<AnimeSource>)
        .getOne();
    } catch (error) {
      throw error;
    }

    if (!animeSource) {
      throw new NotFoundException('data not found');
    }

    return {
      data: plainToInstance(AnimeSourceDto, animeSource),
    };
  }

  async update(id: number, updateAnimeSourceDto: UpdateAnimeSourceDto) {
    try {
      const { data: animeSource } = await this.findOne(id);
      if (!animeSource) throw new NotFoundException('data not found');
      Object.assign(animeSource, updateAnimeSourceDto);
      return this.conAnimeSource.update(
        { id },
        plainToInstance(AnimeSource, animeSource),
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const { data: animeSource } = await this.findOne(id);
      if (!animeSource) throw new NotFoundException('data not found');
      return this.conAnimeSource.remove(
        plainToInstance(AnimeSource, animeSource),
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
