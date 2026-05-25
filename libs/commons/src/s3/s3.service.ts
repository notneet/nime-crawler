import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable, Transform, type TransformCallback } from 'node:stream';

@Injectable()
export class S3Service {
  readonly bucket: string;

  constructor(
    @Inject('S3_CLIENT') private readonly client: S3Client,
    private readonly cfg: ConfigService,
  ) {
    this.bucket = this.cfg.getOrThrow<string>('S3_BUCKET');
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  extOfContentType(ct?: string): string {
    if (!ct) return 'bin';
    const map: Record<string, string> = {
      'video/mp4': 'mp4',
      'application/x-mpegURL': 'm3u8',
      'video/x-matroska': 'mkv',
      'video/webm': 'webm',
    };
    return map[ct.split(';')[0].trim()] ?? 'bin';
  }

  buildKey({
    source,
    slug,
    number,
    quality,
    ext,
  }: {
    source: string;
    slug: string;
    number: string;
    quality: string;
    ext: string;
  }): string {
    return `${source}/${slug}/ep-${number}-${quality}.${ext}`;
  }

  async upload(
    key: string,
    body: Readable,
    contentType?: string,
  ): Promise<{ bucket: string; key: string; sizeBytes: number }> {
    let bytes = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
        bytes += chunk.length;
        cb(null, chunk);
      },
    });
    body.pipe(counter);
    const up = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: counter,
        ContentType: contentType ?? 'application/octet-stream',
      },
      partSize: 8 * 1024 * 1024,
      queueSize: 4,
    });
    const counted = new Promise<void>((resolve, reject) => {
      counter.once('end', resolve);
      counter.once('finish', resolve);
      counter.once('error', reject);
    });
    await Promise.all([up.done(), counted]);
    return { bucket: this.bucket, key, sizeBytes: bytes };
  }
}
