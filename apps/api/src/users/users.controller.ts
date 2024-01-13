import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { isEmpty } from 'class-validator';
import { PublicEndpoint } from '../auth/decorators/public-endpoint.decorator';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiExcludeController()
@Controller('users')
@Serialize(UsersDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @PublicEndpoint()
  async create(
    @Query('app_code') appCode: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (isEmpty(appCode))
      throw new BadRequestException('app_code are required!');

    return this.usersService.create(createUserDto, appCode);
  }

  @Get()
  async findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.usersService.findAll(pageOptDto);
  }
}
