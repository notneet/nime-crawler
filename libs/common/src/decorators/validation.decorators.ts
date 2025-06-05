import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUrl,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  Length,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { applyDecorators } from '@nestjs/common';

/**
 * Validation decorator for anime titles
 */
export function IsAnimeTitle(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    Length(1, 255, validationOptions),
    Transform(({ value }) => value?.trim()),
  );
}

/**
 * Validation decorator for anime slugs
 */
export function IsAnimeSlug(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    Length(1, 255, validationOptions),
    Transform(({ value }) =>
      value
        ?.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, ''),
    ),
  );
}

/**
 * Validation decorator for URLs
 */
export function IsValidUrl(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsUrl(undefined, validationOptions),
    Transform(({ value }) => value?.trim()),
  );
}

/**
 * Validation decorator for positive integers
 */
export function IsPositiveInt(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsNumber({}, validationOptions),
    Min(1, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for non-negative integers
 */
export function IsNonNegativeInt(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for episode numbers
 */
export function IsEpisodeNumber(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsNumber({}, validationOptions),
    Min(1, validationOptions),
    Max(99999, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for anime ratings (0-10)
 */
export function IsAnimeRating(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(10, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for release years
 */
export function IsReleaseYear(validationOptions?: ValidationOptions) {
  const currentYear = new Date().getFullYear();
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(1900, validationOptions),
    Max(currentYear + 5, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for JSON objects
 */
export function IsJsonObject(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }),
  );
}

/**
 * Validation decorator for priority values (1-10)
 */
export function IsPriority(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(1, validationOptions),
    Max(10, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for delay in milliseconds
 */
export function IsDelayMs(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(300000, validationOptions), // Max 5 minutes
    Type(() => Number),
  );
}

/**
 * Custom validator for checking if a string is a valid enum value
 */
export function IsValidEnumString(
  enumObject: object,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEnumString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            typeof value === 'string' &&
            Object.values(enumObject).includes(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: ${Object.values(enumObject).join(', ')}`;
        },
      },
    });
  };
}

/**
 * Validation decorator for pagination limit
 */
export function IsPaginationLimit(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(1, validationOptions),
    Max(100, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for pagination offset
 */
export function IsPaginationOffset(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for search queries
 */
export function IsSearchQuery(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsString(validationOptions),
    Length(2, 100, validationOptions),
    Transform(({ value }) => value?.trim()),
  );
}

/**
 * Validation decorator for file sizes in bytes
 */
export function IsFileSize(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(10737418240, validationOptions), // Max 10GB
    Type(() => Number),
  );
}

/**
 * Validation decorator for HTTP status codes
 */
export function IsHttpStatusCode(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(100, validationOptions),
    Max(599, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for response time in milliseconds
 */
export function IsResponseTime(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(60000, validationOptions), // Max 1 minute
    Type(() => Number),
  );
}

/**
 * Validation decorator for success rate percentage
 */
export function IsSuccessRate(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(100, validationOptions),
    Type(() => Number),
  );
}

/**
 * Validation decorator for cache TTL in seconds
 */
export function IsCacheTTL(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(2592000, validationOptions), // Max 30 days
    Type(() => Number),
  );
}

/**
 * Validation decorator for retry count
 */
export function IsRetryCount(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNumber({}, validationOptions),
    Min(0, validationOptions),
    Max(10, validationOptions),
    Type(() => Number),
  );
}
