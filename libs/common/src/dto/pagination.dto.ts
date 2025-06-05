import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPaginationLimit, IsPaginationOffset } from '../decorators';

export class PaginationDto {
  @IsOptional()
  @IsPaginationLimit()
  limit?: number = 20;

  @IsOptional()
  @IsPaginationOffset()
  offset?: number = 0;

  @IsOptional()
  @IsPaginationOffset()
  page?: number = 1;
}

export class PaginationResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}
