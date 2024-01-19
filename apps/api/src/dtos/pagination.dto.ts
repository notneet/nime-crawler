import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PageOptionsDto {
  @ApiPropertyOptional({ example: 'K-' })
  @IsOptional()
  readonly search?: string;

  @ApiPropertyOptional({ example: 'title' })
  @IsOptional()
  readonly searchBy?: string;

  @ApiPropertyOptional({ enum: Order, example: Order.ASC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take?: number = 10;

  get skip(): number {
    return ((this?.page ?? 1) - 1) * (this?.take ?? 10);
  }
}

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
}

export class PageMetaDto {
  @ApiProperty({ readOnly: true, example: 1 })
  readonly page: number;

  @ApiProperty({ readOnly: true, example: 10 })
  readonly take: number;

  @ApiProperty({ readOnly: true, example: 100 })
  readonly itemCount: number;

  @ApiProperty({ readOnly: true, example: 10 })
  readonly pageCount: number;

  @ApiProperty({ readOnly: true, example: true })
  readonly hasPreviousPage: boolean;

  @ApiProperty({ readOnly: true, example: false })
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    this.page = pageOptionsDto?.page || 1;
    this.take = pageOptionsDto?.take || 10;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}

export class PageDto<T> {
  @ApiProperty({ readOnly: true })
  readonly data: T;

  @ApiPropertyOptional({ readOnly: true, type: PageMetaDto })
  readonly meta?: PageMetaDto;

  constructor(data: T, meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
