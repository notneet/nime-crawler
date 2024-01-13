import { EnvKey } from '@libs/commons/helper/constant';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { isEmpty, isNotEmpty } from 'class-validator';
import { EntityManager } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersDto } from './dto/users.dto';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly tableName = 'users';

  constructor(
    @InjectEntityManager() private readonly eManager: EntityManager,
    private readonly config: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto, appCode: string) {
    try {
      this.checkAppCode(appCode);
      const userExist = await this.findByUsername(createUserDto.username);

      if (isNotEmpty(userExist)) {
        throw new UnprocessableEntityException('user already exist');
      }

      const hashedPasswd = bcrypt.hashSync(createUserDto.password, 10);
      createUserDto.password = hashedPasswd;
      const user = this.usersEntityMetadata.create(createUserDto);

      return this.usersEntityMetadata
        .createQueryBuilder()
        .insert()
        .into(this.tableName)
        .values(user)
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(pageOptDto: PageOptionsDto): Promise<PageDto<UsersDto[]>> {
    try {
      const data = await this.baseQuery()
        .orderBy('q.updated_at', pageOptDto?.order)
        .skip(pageOptDto?.skip)
        .take(pageOptDto?.take)
        .getRawMany();
      const itemCount = +(
        await this.baseQuery()
          .orderBy(`q.updated_at`, pageOptDto?.order)
          .addSelect('COUNT(q.id)', 'usersCount')
          .getRawOne()
      ).usersCount;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data: plainToInstance(UsersDto, data),
        meta: pageMetaDto,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUsername(username: string): Promise<Users | undefined> {
    try {
      return this.baseQuery()
        .where({ username } as Partial<Users>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   */

  private checkAppCode(appCode: string) {
    const appCodeServer = this.config.get<string>(EnvKey.APP_CODE, '');

    if (isEmpty(appCodeServer))
      throw new InternalServerErrorException('APP_CODE are not set');

    if (appCode !== appCodeServer)
      throw new UnauthorizedException('invalid app_code');

    return true;
  }

  private baseQuery(tableName: string = this.tableName) {
    return this.eManager.createQueryBuilder().from(tableName, `q`);
  }

  private get usersEntityMetadata() {
    return this.eManager.connection.getRepository(Users);
  }
}
