import { ApiProperty } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({ example: 'hanivan20@gmail.com' })
  email: string;

  @ApiProperty({ example: '@hanivanrizky' })
  telegram: string;
}

export class MaintainerDto {
  @ApiProperty({ example: 'Hanivan Rizky S' })
  name: string;

  @ApiProperty({ example: '@Hanivan' })
  github: string;

  @ApiProperty({ example: 'https://hanivan.my.id' })
  url: string;

  @ApiProperty({ type: ContactDto, isArray: true })
  contact: ContactDto[];
}

export class AppInfoDto {
  @ApiProperty({ example: 'nime-crawler' })
  app_name: string;

  @ApiProperty({ example: '0.0.1' })
  app_version: string;

  @ApiProperty({ example: 'https://github.com/notneet/nime-crawler' })
  repo: string;

  @ApiProperty({ example: '{{baseurl}}/docs' })
  url_docs: string;

  @ApiProperty({ type: MaintainerDto, isArray: true })
  maintainer: MaintainerDto[];
}
