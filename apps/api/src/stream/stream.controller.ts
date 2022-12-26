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
import { StreamService } from './stream.service';
import { Stream } from '@libs/commons/dto/stream.dto';

@Controller('stream')
@UsePipes(ValidationPipe)
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post()
  async create(@Body() createStreamDto: Stream) {
    await this.streamService.create(createStreamDto);
    return new HttpException('data created', HttpStatus.CREATED);
  }

  @Get()
  async findAll() {
    return this.streamService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.streamService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStreamDto: Partial<Stream>,
  ) {
    await this.streamService.update(id, updateStreamDto);
    return new HttpException('data updated', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.streamService.remove(id);
    return new HttpException('data deleted', HttpStatus.OK);
  }
}
