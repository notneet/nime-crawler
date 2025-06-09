import { ApiProperty } from '@nestjs/swagger';

export interface PaginationData {
  limit: number;
  page: number;
  total_items: number;
  total_pages: number;
}

export interface ApiResponseArrayData<T> {
  items: T[];
  pagination?: PaginationData;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  error?: string;
  timestamp: string;
  data?: T | ApiResponseArrayData<T>;
}

export class PaginationDataDto implements PaginationData {
  @ApiProperty({ description: 'Maximum number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Total number of items' })
  total_items: number;

  @ApiProperty({ description: 'Total number of pages' })
  total_pages: number;
}

export class ApiResponseArrayDataDto<T> implements ApiResponseArrayData<T> {
  @ApiProperty({ description: 'Array of result items', isArray: true })
  items: T[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDataDto,
    required: false,
  })
  pagination?: PaginationDataDto;
}

export class ApiResponseDto<T> implements ApiResponse<T> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Error message if any', required: false })
  error?: string;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T | ApiResponseArrayDataDto<T>;
}
