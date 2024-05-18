import { TypedRoute } from '@nestia/core';
import { Controller, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicEndpoint } from '../auth/decorators/public-endpoint.decorator';
import { PipesService } from './pipes.service';

@ApiTags('Pipes')
@Controller({
  version: '1',
  path: 'pipes',
})
export class PipesController {
  constructor(private readonly pipesService: PipesService) {}

  @PublicEndpoint()
  @TypedRoute.Get()
  findAll() {
    return this.pipesService.findAll();
  }

  @PublicEndpoint()
  @TypedRoute.Get(':id')
  findOne(@Param('id') id: string) {
    return this.pipesService.findOne(+id);
  }
}
