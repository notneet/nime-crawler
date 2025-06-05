import { Transform, Type } from 'class-transformer';
import { applyDecorators } from '@nestjs/common';

/**
 * Transform decorator to trim string values
 */
export function TrimString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * Transform decorator to convert string to lowercase
 */
export function ToLowerCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}

/**
 * Transform decorator to convert string to uppercase
 */
export function ToUpperCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  });
}

/**
 * Transform decorator to generate slug from title
 */
export function ToSlug() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
    }
    return value;
  });
}

/**
 * Transform decorator to parse JSON string to object
 */
export function ParseJson() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  });
}

/**
 * Transform decorator to convert string to number
 */
export function ToNumber() {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      return value;
    }),
    Type(() => Number),
  );
}

/**
 * Transform decorator to convert string to integer
 */
export function ToInt() {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value === 'string') {
        const num = parseInt(value, 10);
        return isNaN(num) ? value : num;
      }
      return value;
    }),
    Type(() => Number),
  );
}

/**
 * Transform decorator to convert string to boolean
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return Boolean(value);
  });
}

/**
 * Transform decorator to convert string to Date
 */
export function ToDate() {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date;
      }
      return value;
    }),
    Type(() => Date),
  );
}

/**
 * Transform decorator to sanitize HTML content
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      // Basic HTML sanitization - remove script tags and dangerous attributes
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    }
    return value;
  });
}

/**
 * Transform decorator to normalize URL
 */
export function NormalizeUrl() {
  return Transform(({ value }) => {
    if (typeof value === 'string' && value.trim()) {
      try {
        const url = new URL(value.trim());
        return url.toString();
      } catch {
        // If it's not a valid URL, return as is
        return value.trim();
      }
    }
    return value;
  });
}

/**
 * Transform decorator to convert comma-separated string to array
 */
export function ToArray(separator: string = ',') {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(separator).map(item => item.trim()).filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value].filter(Boolean);
  });
}

/**
 * Transform decorator to remove extra whitespace from strings
 */
export function NormalizeWhitespace() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/\s+/g, ' ').trim();
    }
    return value;
  });
}

/**
 * Transform decorator to capitalize first letter of each word
 */
export function ToTitleCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return value;
  });
}

/**
 * Transform decorator to ensure value is within min/max bounds
 */
export function ClampNumber(min: number, max: number) {
  return Transform(({ value }) => {
    if (typeof value === 'number') {
      return Math.min(Math.max(value, min), max);
    }
    return value;
  });
}

/**
 * Transform decorator to format episode number with leading zeros
 */
export function FormatEpisodeNumber(digits: number = 2) {
  return Transform(({ value }) => {
    if (typeof value === 'number') {
      return value.toString().padStart(digits, '0');
    }
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        return num.toString().padStart(digits, '0');
      }
    }
    return value;
  });
}

/**
 * Transform decorator to extract domain from URL
 */
export function ExtractDomain() {
  return Transform(({ value }) => {
    if (typeof value === 'string' && value.trim()) {
      try {
        const url = new URL(value.trim());
        return url.hostname;
      } catch {
        return value;
      }
    }
    return value;
  });
}