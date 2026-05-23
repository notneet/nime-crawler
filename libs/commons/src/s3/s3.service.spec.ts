import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest
    .fn()
    .mockImplementation((args) => ({ args, done: jest.fn().mockResolvedValue(undefined) })),
}));

const UploadMock = Upload as unknown as jest.Mock;

describe('S3Service', () => {
  const bucket = 'anime-archive';
  let service: S3Service;

  beforeEach(() => {
    UploadMock.mockClear();
    const client = {} as unknown as S3Client;
    const cfg = {
      getOrThrow: jest.fn().mockReturnValue(bucket),
    } as unknown as ConfigService;
    service = new S3Service(client, cfg);
  });

  describe('extOfContentType', () => {
    it('maps video/mp4 to mp4', () => {
      expect(service.extOfContentType('video/mp4')).toBe('mp4');
    });

    it('maps application/x-mpegURL to m3u8', () => {
      expect(service.extOfContentType('application/x-mpegURL')).toBe('m3u8');
    });

    it('strips params', () => {
      expect(service.extOfContentType('video/mp4; charset=utf-8')).toBe('mp4');
    });

    it('returns bin for undefined', () => {
      expect(service.extOfContentType(undefined)).toBe('bin');
    });

    it('returns bin for unknown type', () => {
      expect(service.extOfContentType('image/jpeg')).toBe('bin');
    });
  });

  describe('buildKey', () => {
    it('builds the expected key', () => {
      expect(
        service.buildKey({
          source: 'otakudesu',
          slug: 'naruto',
          number: '12',
          quality: '1080p',
          ext: 'mp4',
        }),
      ).toBe('otakudesu/naruto/ep-12-1080p.mp4');
    });
  });

  describe('upload', () => {
    it('uploads and returns size metadata', async () => {
      const stream = Readable.from([Buffer.from('abc'), Buffer.from('de')]);
      const result = await service.upload('some/key.mp4', stream, 'video/mp4');

      expect(result).toEqual({ bucket, key: 'some/key.mp4', sizeBytes: 5 });
      expect(UploadMock).toHaveBeenCalledTimes(1);
      const args = UploadMock.mock.calls[0][0];
      expect(args.partSize).toBe(8 * 1024 * 1024);
      expect(args.queueSize).toBe(4);
      expect(args.params.Bucket).toBe(bucket);
      expect(args.params.Key).toBe('some/key.mp4');
    });
  });
});
