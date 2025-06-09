import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiResponse,
  ApiResponseArrayData,
  PaginationData,
} from '../interfaces/api-response.interface';

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  message: string,
  data?: T | T[] | null,
  pagination?: PaginationData,
  error?: string,
): ApiResponse<T> {
  const timestamp = new Date().toISOString();

  let responseData: T | ApiResponseArrayData<T> | undefined;

  if (data !== null && data !== undefined) {
    if (Array.isArray(data)) {
      // If it's an array, use the items/pagination format
      responseData = {
        items: data,
        pagination,
      };
    } else {
      // If it's a single object, use it directly
      responseData = data;
    }
  }

  return {
    success,
    message,
    error,
    timestamp,
    data: responseData,
  };
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  message: string,
  data?: T | T[] | null,
  pagination?: PaginationData,
): ApiResponse<T> {
  return createApiResponse(true, message, data, pagination);
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  message: string,
  error?: string,
): ApiResponse {
  return createApiResponse(false, message, null, undefined, error);
}

/**
 * Create an HTTP exception with standardized error format
 */
export function createHttpException(
  message: string,
  error: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
): HttpException {
  return new HttpException(createErrorResponse(message, error), status);
}

/**
 * Create a paginated response from an array of items
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
  message: string = 'Items retrieved successfully',
): ApiResponse<T> {
  const totalPages = Math.ceil(totalItems / limit);

  const pagination: PaginationData = {
    page,
    limit,
    total_items: totalItems,
    total_pages: totalPages,
  };

  return createSuccessResponse(message, items, pagination);
}
