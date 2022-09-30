import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { WatchService } from './watch.service';
import { Prisma } from '@prisma/client';

@Controller('watch')
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @Post()
  async create(@Body() createWatchDto: Prisma.WatchCreateInput) {
    return await this.watchService.create(createWatchDto);
  }

  @Get()
  async findAll() {
    return await this.watchService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.watchService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWatchDto: Prisma.WatchUpdateInput,
  ) {
    return await this.watchService.update(id, updateWatchDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.watchService.remove(id);
  }
}
