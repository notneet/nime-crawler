/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate anime title
 */
export function isValidAnimeTitle(title: string): boolean {
  if (!title || typeof title !== 'string') {
    return false;
  }

  return title.trim().length >= 1 && title.length <= 255;
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 255;
}

/**
 * Validate episode number
 */
export function isValidEpisodeNumber(episode: number): boolean {
  return typeof episode === 'number' && episode >= 1 && episode <= 99999;
}

/**
 * Validate rating (0-10)
 */
export function isValidRating(rating: number): boolean {
  return typeof rating === 'number' && rating >= 0 && rating <= 10;
}

/**
 * Validate release year
 */
export function isValidReleaseYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return typeof year === 'number' && year >= 1900 && year <= currentYear + 5;
}

/**
 * Validate priority (1-10)
 */
export function isValidPriority(priority: number): boolean {
  return typeof priority === 'number' && priority >= 1 && priority <= 10;
}

/**
 * Validate delay in milliseconds
 */
export function isValidDelay(delay: number): boolean {
  return typeof delay === 'number' && delay >= 0 && delay <= 300000; // Max 5 minutes
}

/**
 * Validate file size in bytes
 */
export function isValidFileSize(size: number): boolean {
  return typeof size === 'number' && size >= 0 && size <= 10737418240; // Max 10GB
}

/**
 * Validate HTTP status code
 */
export function isValidHttpStatusCode(code: number): boolean {
  return typeof code === 'number' && code >= 100 && code <= 599;
}

/**
 * Validate response time in milliseconds
 */
export function isValidResponseTime(time: number): boolean {
  return typeof time === 'number' && time >= 0 && time <= 60000; // Max 1 minute
}

/**
 * Validate success rate percentage
 */
export function isValidSuccessRate(rate: number): boolean {
  return typeof rate === 'number' && rate >= 0 && rate <= 100;
}

/**
 * Validate JSON string
 */
export function isValidJson(jsonString: string): boolean {
  if (!jsonString || typeof jsonString !== 'string') {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return typeof port === 'number' && port >= 1 && port <= 65535;
}

/**
 * Validate hexadecimal color code
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Check if value is null or undefined
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}