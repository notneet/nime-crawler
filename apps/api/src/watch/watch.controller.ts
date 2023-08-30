import { CreateWatchDto } from '@libs/commons/dto/create/create-watch.dto';
import { UpdateWatchDto } from '@libs/commons/dto/update/update-watch.dto';
import { WatchDto } from '@libs/commons/dto/watch.dto';
import { Serialize } from '@libs/commons/interceptors/serialize.interceptor';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { WatchService } from './watch.service';

@Controller('watch')
@Serialize(WatchDto)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post(':id')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() createWatchDto: CreateWatchDto,
  ) {
    return this.watchService.create(createWatchDto, id);
  }

  @Get()
  findAll(@Param('id') id: string) {
    if (isEmpty(id))
      throw new BadRequestException('id of media must be present');

    return this.watchService.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.watchService.findByObjectId(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWatchDto: UpdateWatchDto) {
    return this.watchService.update(id, updateWatchDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.watchService.remove(id);
  }
}
