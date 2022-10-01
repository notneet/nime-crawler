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
import { StreamService } from './stream.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import { Prisma } from '@prisma/client';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post()
  async create(@Body() createStreamDto: Prisma.StreamCreateInput) {
    return this.streamService.create(createStreamDto);
  }

  @Get()
  async findAll() {
    return await this.streamService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.streamService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStreamDto: UpdateStreamDto,
  ) {
    return this.streamService.update(id, updateStreamDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.streamService.remove(id);
  }
}
