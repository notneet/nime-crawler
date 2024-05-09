import { Injectable } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { hashUUID } from '../helper/md5';

@Injectable()
export class StringHelperService {
  constructor() {}

  createUUID(baseUrl: string, oldOrigin?: string | null) {
    if (isEmpty(baseUrl)) throw new Error('baseUrl cannot be empty!');

    return hashUUID(this.replaceUrl(baseUrl, String(oldOrigin)));
  }

  private replaceUrl(currentPageUrl: string, oldOrigin?: string) {
    if (isEmpty(oldOrigin)) return currentPageUrl;

    // jika current origin sama dengan media url lama. maka pake object_id lama. selain itu yang baru
    const extractedEndpoint = new URL(currentPageUrl);
    const currentHost = extractedEndpoint?.host;
    const currentPath = extractedEndpoint?.pathname;

    return currentHost === oldOrigin
      ? `${extractedEndpoint?.protocol}//${oldOrigin}${currentPath}` //`use old`
      : currentPageUrl;
  }
}
