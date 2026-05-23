import { DataSource } from 'typeorm';
import { S3Service } from '@libs/commons/s3/s3.service';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { Anime, Episode, DownloadLink, DownloadArchive } from '@libs/commons/entities';
import { ArchiveService } from './archive.service';

type MockRepo = {
  findOneBy: jest.Mock;
  findOneByOrFail: jest.Mock;
  find: jest.Mock;
  upsert: jest.Mock;
  update: jest.Mock;
};

function makeRepo(): MockRepo {
  return {
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    upsert: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

function webBody(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array([1, 2, 3]));
      c.close();
    },
  });
}

function dl(id: number, quality: string): DownloadLink {
  return {
    id,
    source: 'otaku',
    ownerUrl: 'http://ep/1',
    kind: 'download',
    quality,
    url: `http://file/${id}`,
  } as DownloadLink;
}

describe('ArchiveService', () => {
  let repos: Record<string, MockRepo>;
  let ds: DataSource;
  let s3: jest.Mocked<Pick<S3Service, 'extOfContentType' | 'buildKey' | 'upload'>> & { bucket: string };
  let svc: ArchiveService;

  const job: DownloadJobDto = { episodeId: 7, source: 'otaku' };
  const ep: Episode = {
    id: 7,
    source: 'otaku',
    url: 'http://ep/1',
    animeUrl: 'http://anime/1',
    number: '5',
  } as Episode;

  beforeEach(() => {
    repos = {
      Episode: makeRepo(),
      DownloadLink: makeRepo(),
      DownloadArchive: makeRepo(),
      Anime: makeRepo(),
    };
    const byName: Record<string, MockRepo> = {
      [Episode.name]: repos.Episode,
      [DownloadLink.name]: repos.DownloadLink,
      [DownloadArchive.name]: repos.DownloadArchive,
      [Anime.name]: repos.Anime,
    };
    ds = {
      getRepository: jest.fn((e: { name: string }) => byName[e.name]),
    } as unknown as DataSource;

    s3 = {
      bucket: 'b',
      extOfContentType: jest.fn(() => 'mp4'),
      buildKey: jest.fn(
        (a: { source: string; slug: string; number: string; quality: string; ext: string }) =>
          `${a.source}/${a.slug}/ep-${a.number}-${a.quality}.${a.ext}`,
      ),
      upload: jest.fn((key: string) => Promise.resolve({ bucket: 'b', key, sizeBytes: 3 })),
    };

    repos.Episode.findOneBy.mockResolvedValue(ep);
    repos.Anime.findOneBy.mockResolvedValue({ slug: 'naruto' } as Anime);
    let nextId = 100;
    repos.DownloadArchive.findOneByOrFail.mockImplementation(() =>
      Promise.resolve({ id: nextId++ } as DownloadArchive),
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: webBody(),
      headers: { get: () => 'video/mp4' },
    }) as unknown as typeof fetch;

    svc = new ArchiveService(ds, s3 as unknown as S3Service);
  });

  it('zero downloads -> nothing archived', async () => {
    repos.DownloadLink.find.mockResolvedValue([]);
    await svc.handle(job);
    expect(repos.DownloadArchive.upsert).not.toHaveBeenCalled();
    expect(repos.DownloadArchive.update).not.toHaveBeenCalled();
    expect(s3.upload).not.toHaveBeenCalled();
  });

  it('1080/720/480 -> archives 2 (max+min) with distinct keys', async () => {
    repos.DownloadLink.find.mockResolvedValue([dl(1, '1080p'), dl(2, '720p'), dl(3, '480p')]);
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: true, status: 200, body: webBody(), headers: { get: () => 'video/mp4' } }),
    );
    await svc.handle(job);
    expect(s3.upload).toHaveBeenCalledTimes(2);
    const keys = s3.upload.mock.calls.map((c) => c[0]);
    expect(new Set(keys).size).toBe(2);
    const doneUpdates = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'done',
    );
    expect(doneUpdates).toHaveLength(2);
  });

  it('only 1080 -> exactly 1 upload + 1 done', async () => {
    repos.DownloadLink.find.mockResolvedValue([dl(1, '1080p')]);
    await svc.handle(job);
    expect(s3.upload).toHaveBeenCalledTimes(1);
    const doneUpdates = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'done',
    );
    expect(doneUpdates).toHaveLength(1);
  });

  it('fetch non-2xx -> marked failed, no upload', async () => {
    repos.DownloadLink.find.mockResolvedValue([dl(1, '1080p')]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, body: null, headers: { get: () => null } });
    await svc.handle(job);
    expect(s3.upload).not.toHaveBeenCalled();
    const failed = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'failed',
    );
    expect(failed).toHaveLength(1);
  });

  it('upload throws -> failed with error message', async () => {
    repos.DownloadLink.find.mockResolvedValue([dl(1, '1080p')]);
    s3.upload.mockRejectedValue(new Error('boom'));
    await svc.handle(job);
    const failed = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'failed',
    );
    expect(failed).toHaveLength(1);
    expect((failed[0][1] as { error: string }).error).toBe('boom');
  });

  it('anime miss -> buildKey slug is unknown-anime-<id>', async () => {
    repos.DownloadLink.find.mockResolvedValue([dl(1, '1080p')]);
    repos.Anime.findOneBy.mockResolvedValue(null);
    await svc.handle(job);
    expect(s3.buildKey).toHaveBeenCalledWith(expect.objectContaining({ slug: `unknown-anime-${ep.id}` }));
  });
});
