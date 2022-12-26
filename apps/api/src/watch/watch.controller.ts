import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WatchService } from './watch.service';
import { Watch } from '@libs/commons/dto/watch.dto';

@Controller('watch')
@UsePipes(ValidationPipe)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post()
  async create(@Body() createWatchDto: Watch) {
    await this.watchService.create(createWatchDto);
    return new HttpException('data created', HttpStatus.CREATED);
  }

  @Get()
  findAll() {
    return this.watchService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.watchService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWatchDto: Partial<Watch>,
  ) {
    await this.watchService.update(id, updateWatchDto);
    return new HttpException('data updated', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.watchService.remove(id);
    return new HttpException('data deleted', HttpStatus.OK);
  }
}
