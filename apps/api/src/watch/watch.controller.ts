import { AllowedUserRoles } from '@libs/commons/decorators/allowed-role.decorator';
import { CreateWatchDto } from '@libs/commons/dto/create/create-watch.dto';
import { ExampleWatchDtoResponse } from '@libs/commons/dto/example/watch-example.dto';
import { UpdateWatchDto } from '@libs/commons/dto/update/update-watch.dto';
import { SearchWatchDto } from '@libs/commons/dto/watch-search.dto';
import { WatchDto } from '@libs/commons/dto/watch.dto';
import { TypedRoute } from '@nestia/core';
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Query,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { isEmpty } from 'class-validator';
import { PublicEndpoint } from '../auth/decorators/public-endpoint.decorator';
import { PageOptionsDto } from '../dtos/pagination.dto';
import { WatchService } from './watch.service';

@ApiTags('Watches')
@Controller({
  version: '1',
  path: 'watches',
})
// @Serialize(WatchDto)
export class WatchController {
  constructor(private readonly watchService: WatchService) {}

  @ApiExcludeEndpoint()
  @AllowedUserRoles(['admin'])
  @TypedRoute.Post(':media_id')
  create(
    @Param('media_id') mediaId: string,
    @Body() createWatchDto: CreateWatchDto,
  ) {
    return this.watchService.create(createWatchDto, mediaId);
  }

  @ApiOkResponse({ type: ExampleWatchDtoResponse })
  @PublicEndpoint()
  @TypedRoute.Get()
  async findAll(
    @Query('media_id') mediaId: string,
    @Query() pageOptDto: PageOptionsDto,
    @Query() searchWatch: SearchWatchDto,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.watchService.findAll(mediaId, pageOptDto, searchWatch);
  }

  @ApiOkResponse({ type: WatchDto })
  @PublicEndpoint()
  @TypedRoute.Get(':objectId')
  findOne(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.watchService.findByObjectId(mediaId, objectId);
  }

  @ApiOkResponse({ type: WatchDto })
  @PublicEndpoint()
  @TypedRoute.Get('url/:url_watch')
  findByUrl(
    @Query('media_id') mediaId: string,
    @Param('url_watch') urlWatch: string,
  ) {
    this.handleMediaIdNotDefined(mediaId);

    return this.watchService.findByUrl(mediaId, urlWatch);
  }

  @ApiExcludeEndpoint()
  @AllowedUserRoles(['admin'])
  @TypedRoute.Patch(':objectId')
  update(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
    @Body() updateWatchDto: UpdateWatchDto,
  ) {
    return this.watchService.update(mediaId, objectId, updateWatchDto);
  }

  @ApiExcludeEndpoint()
  @AllowedUserRoles(['admin'])
  @TypedRoute.Delete(':objectId')
  remove(
    @Query('media_id') mediaId: string,
    @Param('objectId') objectId: string,
  ) {
    return this.watchService.remove(mediaId, objectId);
  }

  private handleMediaIdNotDefined(mediaId?: string) {
    if (isEmpty(mediaId))
      throw new BadRequestException(
        `Query param "media_id" of media must be present`,
      );
  }
}
