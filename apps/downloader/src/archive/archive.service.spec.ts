import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '@libs/commons/s3/s3.service';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { Anime, Episode, Mirror, DownloadArchive } from '@libs/commons/entities';
import { ArchiveService } from './archive.service';

jest.mock('node:child_process', () => ({ spawn: jest.fn() }));

type MockRepo = {
  findOneBy: jest.Mock;
  findOneByOrFail: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
};

function makeRepo(): MockRepo {
  return {
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    find: jest.fn(),
    create: jest.fn((e: unknown) => e),
    save: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

function makeChild(
  code = 0,
  stderr = '',
): EventEmitter & { stdout: Readable; stderr: EventEmitter; kill: jest.Mock; killed: boolean } {
  const child = new EventEmitter() as EventEmitter & {
    stdout: Readable;
    stderr: EventEmitter;
    kill: jest.Mock;
    killed: boolean;
  };
  child.stdout = Readable.from([Buffer.from([1, 2, 3])]);
  child.stderr = new EventEmitter();
  child.killed = false;
  child.kill = jest.fn();
  setImmediate(() => {
    if (stderr) child.stderr.emit('data', Buffer.from(stderr));
    child.emit('close', code);
  });
  return child;
}

function mir(id: number, quality: string, host = 'otakuwatch6hd', streamUrl = `https://desustream.info/x/${id}`): Mirror {
  return { id, episodeUrl: 'http://ep/1', quality, host, streamUrl } as Mirror;
}

describe('ArchiveService', () => {
  let repos: Record<string, MockRepo>;
  let ds: DataSource;
  let s3: jest.Mocked<Pick<S3Service, 'buildKey' | 'upload'>> & { bucket: string };
  let svc: ArchiveService;
  const spawnMock = spawn as unknown as jest.Mock;

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
      Mirror: makeRepo(),
      DownloadArchive: makeRepo(),
      Anime: makeRepo(),
    };
    const byName: Record<string, MockRepo> = {
      [Episode.name]: repos.Episode,
      [Mirror.name]: repos.Mirror,
      [DownloadArchive.name]: repos.DownloadArchive,
      [Anime.name]: repos.Anime,
    };
    ds = {
      getRepository: jest.fn((e: { name: string }) => byName[e.name]),
    } as unknown as DataSource;

    s3 = {
      bucket: 'b',
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
    repos.DownloadArchive.save.mockImplementation(() =>
      Promise.resolve({ id: nextId++ } as DownloadArchive),
    );

    spawnMock.mockReset();
    spawnMock.mockImplementation(() => makeChild(0));

    const cfg = { get: (_k: string, d?: string) => d } as unknown as ConfigService;
    svc = new ArchiveService(ds, s3 as unknown as S3Service, cfg);
  });

  it('no resolvable mirrors -> nothing archived', async () => {
    repos.Mirror.find.mockResolvedValue([
      { id: 1, episodeUrl: 'http://ep/1', quality: '480p', host: 'mega', streamUrl: null } as unknown as Mirror,
    ]);
    await svc.handle(job);
    expect(repos.DownloadArchive.save).not.toHaveBeenCalled();
    expect(s3.upload).not.toHaveBeenCalled();
  });

  it('720/480/360 -> archives 2 (max+min) with distinct keys', async () => {
    repos.Mirror.find.mockResolvedValue([mir(1, '720p'), mir(2, '480p'), mir(3, '360p')]);
    await svc.handle(job);
    expect(s3.upload).toHaveBeenCalledTimes(2);
    const keys = s3.upload.mock.calls.map((c) => c[0]);
    expect(new Set(keys).size).toBe(2);
    const doneUpdates = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'done',
    );
    expect(doneUpdates).toHaveLength(2);
  });

  it('only one resolvable quality -> exactly 1 upload + 1 done', async () => {
    repos.Mirror.find.mockResolvedValue([mir(1, '720p')]);
    await svc.handle(job);
    expect(s3.upload).toHaveBeenCalledTimes(1);
    const doneUpdates = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'done',
    );
    expect(doneUpdates).toHaveLength(1);
  });

  it('prefers a desustream.info host at a given quality', async () => {
    repos.Mirror.find.mockResolvedValue([
      mir(1, '720p', 'vidhide', 'https://odvidhide.com/embed/abc'),
      mir(2, '720p', 'otakuwatch6hd', 'https://desustream.info/x/2'),
      mir(3, '720p', 'mega', 'https://mega.nz/embed/xyz'),
    ]);
    await svc.handle(job);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    const passedUrl = spawnMock.mock.calls[0][1].at(-1);
    expect(passedUrl).toBe('https://desustream.info/x/2');
  });

  it('yt-dlp non-zero exit -> marked failed and job rejects (so it dead-letters)', async () => {
    repos.Mirror.find.mockResolvedValue([mir(1, '720p')]);
    spawnMock.mockImplementation(() => makeChild(1, 'ERROR: boom'));
    await expect(svc.handle(job)).rejects.toThrow(/all 1 pick/);
    const failed = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'failed',
    );
    expect(failed).toHaveLength(1);
    expect((failed[0][1] as { error: string }).error).toContain('yt-dlp exit 1');
  });

  it('upload throws -> failed with error message and job rejects', async () => {
    repos.Mirror.find.mockResolvedValue([mir(1, '720p')]);
    s3.upload.mockRejectedValue(new Error('boom'));
    await expect(svc.handle(job)).rejects.toThrow(/all 1 pick/);
    const failed = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'failed',
    );
    expect(failed).toHaveLength(1);
    expect((failed[0][1] as { error: string }).error).toBe('boom');
  });

  it('partial success (max ok, min fails) -> does NOT reject, job is acked', async () => {
    repos.Mirror.find.mockResolvedValue([mir(1, '720p'), mir(2, '360p')]);
    s3.upload.mockImplementationOnce((key: string) => Promise.resolve({ bucket: 'b', key, sizeBytes: 3 }));
    s3.upload.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    await expect(svc.handle(job)).resolves.toBeUndefined();
    const done = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'done',
    );
    const failed = repos.DownloadArchive.update.mock.calls.filter(
      (c) => (c[1] as { status: string }).status === 'failed',
    );
    expect(done).toHaveLength(1);
    expect(failed).toHaveLength(1);
  });

  it('mirrorId set -> archives only that mirror, ignores max/min selection', async () => {
    repos.Mirror.findOneBy.mockResolvedValue(mir(9, '480p', 'mega', 'https://desustream.info/x/9'));
    await svc.handle({ ...job, mirrorId: 9 });
    expect(repos.Mirror.find).not.toHaveBeenCalled();
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0][1].at(-1)).toBe('https://desustream.info/x/9');
    expect(s3.upload).toHaveBeenCalledTimes(1);
  });

  it('mirrorId set but mirror unresolvable -> nothing archived', async () => {
    repos.Mirror.findOneBy.mockResolvedValue({ id: 9, streamUrl: null } as unknown as Mirror);
    await svc.handle({ ...job, mirrorId: 9 });
    expect(s3.upload).not.toHaveBeenCalled();
  });

  it('streamUrl set -> archives the episode stream as quality "source", ignores mirrors', async () => {
    await svc.handle({ ...job, streamUrl: 'https://desustream.info/player/77' });
    expect(repos.Mirror.find).not.toHaveBeenCalled();
    expect(repos.Mirror.findOneBy).not.toHaveBeenCalled();
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0][1].at(-1)).toBe('https://desustream.info/player/77');
    expect(s3.buildKey).toHaveBeenCalledWith(expect.objectContaining({ quality: 'source' }));
    expect(s3.upload).toHaveBeenCalledTimes(1);
  });

  it('anime miss -> buildKey slug is unknown-anime-<id>', async () => {
    repos.Mirror.find.mockResolvedValue([mir(1, '720p')]);
    repos.Anime.findOneBy.mockResolvedValue(null);
    await svc.handle(job);
    expect(s3.buildKey).toHaveBeenCalledWith(expect.objectContaining({ slug: `unknown-anime-${ep.id}` }));
  });
});
