import { createHash } from 'crypto';

export const hashUUID = (code: string) => {
  return createHash('md5').update(code).digest('hex');
};
