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
  create(@Body() createWatchDto: Prisma.WatchCreateInput) {
    return this.watchService.create(createWatchDto);
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWatchDto: Prisma.WatchUpdateInput,
  ) {
    return this.watchService.update(id, updateWatchDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.watchService.remove(id);
  }
}
