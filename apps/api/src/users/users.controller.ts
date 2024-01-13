import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import { TypedRoute } from '@nestia/core';
import { BadRequestException, Body, Controller, Query } from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
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

  @ApiExcludeEndpoint()
  @TypedRoute.Post()
  @PublicEndpoint()
  async create(
    @Query('app_code') appCode: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (isEmpty(appCode))
      throw new BadRequestException('app_code are required!');

    return this.usersService.create(createUserDto, appCode);
  }

  @ApiExcludeEndpoint()
  @TypedRoute.Get()
  async findAll(@Query() pageOptDto: PageOptionsDto) {
    return this.usersService.findAll(pageOptDto);
  }
}
