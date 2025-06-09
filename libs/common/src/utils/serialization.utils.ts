/**
 * Utility function to convert BigInt values to strings in an object
 * This is necessary because JSON.stringify() can't handle BigInt values
 *
 * @param obj Any object that might contain BigInt values
 * @returns A new object with all BigInt values converted to strings
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }

    return result as T;
  }

  return obj;
}

/**
 * Utility function to safely stringify an object with BigInt values
 *
 * @param obj Any object that might contain BigInt values
 * @returns A JSON string representation of the object
 */
export function safeStringify(obj: any): string {
  return JSON.stringify(serializeBigInt(obj));
}
