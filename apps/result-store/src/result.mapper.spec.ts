import { ParsedResultDto } from '@libs/commons/messaging/parsed-result.dto';
import { ResultMapper } from './result.mapper';

describe('ResultMapper', () => {
  let mapper: ResultMapper;

  beforeEach(() => {
    mapper = new ResultMapper();
  });

  // ─── helpers ───────────────────────────────────────────────────────────────

  function dto(stage: ParsedResultDto['stage'], url: string, data: Record<string, unknown>): ParsedResultDto {
    const d = new ParsedResultDto();
    d.source = 'otakudesu';
    d.stage = stage;
    d.url = url;
    d.data = data;
    return d;
  }

  // ─── index ─────────────────────────────────────────────────────────────────

  describe('index stage', () => {
    it('returns empty object', () => {
      const result = mapper.map(dto('index', 'https://otakudesu.blog/', {}));
      expect(result).toEqual({});
    });
  });

  // ─── detail ────────────────────────────────────────────────────────────────

  describe('detail stage', () => {
    const url = 'https://otakudesu.blog/anime/okiraku-ryoushu-tanoshii-sub-indo/';
    const data: Record<string, unknown> = {
      title: 'Okiraku Ryoushu',
      titleJP: 'おきらく領主',
      score: '7.42',
      type: 'TV',
      status: 'Ongoing',
      totalEpisodes: '12',
      duration: '23 min',
      releaseDate: 'Apr 2025',
      studio: 'Studio Gokumi',
      producers: 'Lantis',
      thumbnailUrl: 'https://cdn.otakudesu.blog/thumb.jpg',
      synopsis: 'A lord who enjoys life.',
      genres: ['Action', 'Fantasy'],
      episodeLinks: ['https://otakudesu.blog/episode/ep1/'],
      batchLinks: ['https://otakudesu.blog/batch/series/'],
    };

    it('builds anime with slug derived from url', () => {
      const { anime } = mapper.map(dto('detail', url, data));
      expect(anime?.slug).toBe('okiraku-ryoushu-tanoshii-sub-indo');
      expect(anime?.source).toBe('otakudesu');
      expect(anime?.url).toBe(url);
    });

    it('maps all string fields', () => {
      const { anime } = mapper.map(dto('detail', url, data));
      expect(anime?.title).toBe('Okiraku Ryoushu');
      expect(anime?.titleJP).toBe('おきらく領主');
      expect(anime?.score).toBe('7.42');
      expect(anime?.type).toBe('TV');
      expect(anime?.status).toBe('Ongoing');
      expect(anime?.totalEpisodes).toBe('12');
      expect(anime?.duration).toBe('23 min');
      expect(anime?.releaseDate).toBe('Apr 2025');
      expect(anime?.studio).toBe('Studio Gokumi');
      expect(anime?.producers).toBe('Lantis');
      expect(anime?.thumbnailUrl).toBe('https://cdn.otakudesu.blog/thumb.jpg');
      expect(anime?.synopsis).toBe('A lord who enjoys life.');
    });

    it('maps genres array', () => {
      const { genres } = mapper.map(dto('detail', url, data));
      expect(genres).toEqual(['Action', 'Fantasy']);
    });

    it('stores raw data', () => {
      const { anime } = mapper.map(dto('detail', url, data));
      expect(anime?.raw).toBe(data);
    });

    it('ignores episodeLinks and batchLinks in output', () => {
      const { anime } = mapper.map(dto('detail', url, data));
      expect(anime).not.toHaveProperty('episodeLinks');
      expect(anime).not.toHaveProperty('batchLinks');
    });

    it('omits missing string fields', () => {
      const sparse: Record<string, unknown> = { title: 'X' };
      const { anime } = mapper.map(dto('detail', url, sparse));
      expect(anime?.score).toBeUndefined();
      expect(anime?.type).toBeUndefined();
    });

    it('omits empty-string fields', () => {
      const { anime } = mapper.map(dto('detail', url, { title: '', score: '7' }));
      expect(anime?.title).toBeUndefined();
      expect(anime?.score).toBe('7');
    });

    it('returns empty genres when not present', () => {
      const { genres } = mapper.map(dto('detail', url, { title: 'X' }));
      expect(genres).toEqual([]);
    });
  });

  // ─── episode ───────────────────────────────────────────────────────────────

  describe('episode stage', () => {
    const url = 'https://otakudesu.blog/episode/okiraku-episode-3/';
    const baseData: Record<string, unknown> = {
      title: 'Episode 3',
      animeUrl: 'https://otakudesu.blog/anime/okiraku/',
      streamUrl: 'https://stream.example.com/ep3-default.mp4',
      kategoz: ['Posted by admin', 'Release on April 3, 2025'],
      downloads: [
        { quality: '360p', size: '40 MB', links: ['https://dl1.example.com/ep3-360.mkv'], hosts: ['Zippyshare'] },
        { quality: '720p', size: '120 MB', links: ['https://dl2.example.com/ep3-720.mp4', 'https://dl3.example.com/ep3-720.mp4'], hosts: ['GDrive', 'Mega'] },
      ],
      mirror360Host: ['Zippyshare', 'GoogleDrive'],
      mirror360Payload: ['zip360payload', 'gdrive360payload'],
      mirror480Host: ['Mega'],
      mirror480Payload: ['mega480payload'],
      mirror720Host: ['Zippyshare', 'OneDrive'],
      mirror720Payload: ['zip720payload', 'od720payload'],
      m720url1: 'https://resolved.example.com/720-1',
      m720url2: 'https://resolved.example.com/720-2',
    };

    it('builds episode with source and url', () => {
      const { episode } = mapper.map(dto('episode', url, baseData));
      expect(episode?.source).toBe('otakudesu');
      expect(episode?.url).toBe(url);
    });

    it('parses episode number from url', () => {
      const { episode } = mapper.map(dto('episode', url, baseData));
      expect(episode?.number).toBe('3');
    });

    it('maps streamUrl and animeUrl', () => {
      const { episode } = mapper.map(dto('episode', url, baseData));
      expect(episode?.streamUrl).toBe('https://stream.example.com/ep3-default.mp4');
      expect(episode?.animeUrl).toBe('https://otakudesu.blog/anime/okiraku/');
    });

    it('strips labels from kategoz into postedBy and releaseInfo', () => {
      const { episode } = mapper.map(dto('episode', url, baseData));
      expect(episode?.postedBy).toBe('admin');
      expect(episode?.releaseInfo).toBe('April 3, 2025');
    });

    it('omits postedBy and releaseInfo when kategoz absent', () => {
      const d: Record<string, unknown> = { ...baseData, kategoz: undefined };
      const { episode } = mapper.map(dto('episode', url, d));
      expect(episode?.postedBy).toBeUndefined();
      expect(episode?.releaseInfo).toBeUndefined();
    });

    it('maps title', () => {
      const { episode } = mapper.map(dto('episode', url, baseData));
      expect(episode?.title).toBe('Episode 3');
    });

    it('stores raw data', () => {
      const { episode } = mapper.map(dto('episode', url, baseData));
      expect(episode?.raw).toBe(baseData);
    });

    it('yields no episode number when url has no episode-N pattern', () => {
      const { episode } = mapper.map(dto('episode', 'https://otakudesu.blog/ep/special/', baseData));
      expect(episode?.number).toBeUndefined();
    });

    describe('mirrors zipping', () => {
      it('zips 360p mirrors (no streamUrl — not resolved)', () => {
        const { mirrors } = mapper.map(dto('episode', url, baseData));
        const q360 = mirrors?.filter(m => m.quality === '360p') ?? [];
        expect(q360).toHaveLength(2);
        expect(q360[0]).toEqual({ episodeUrl: url, quality: '360p', host: 'Zippyshare', payload: 'zip360payload' });
        expect(q360[1]).toEqual({ episodeUrl: url, quality: '360p', host: 'GoogleDrive', payload: 'gdrive360payload' });
      });

      it('zips 480p mirrors', () => {
        const { mirrors } = mapper.map(dto('episode', url, baseData));
        const q480 = mirrors?.filter(m => m.quality === '480p') ?? [];
        expect(q480).toHaveLength(1);
        expect(q480[0]).toEqual({ episodeUrl: url, quality: '480p', host: 'Mega', payload: 'mega480payload' });
      });

      it('zips 720p mirrors with resolved streamUrl per slot', () => {
        const { mirrors } = mapper.map(dto('episode', url, baseData));
        const q720 = mirrors?.filter(m => m.quality === '720p') ?? [];
        expect(q720).toHaveLength(2);
        expect(q720[0]).toEqual({ episodeUrl: url, quality: '720p', host: 'Zippyshare', payload: 'zip720payload', streamUrl: 'https://resolved.example.com/720-1' });
        expect(q720[1]).toEqual({ episodeUrl: url, quality: '720p', host: 'OneDrive', payload: 'od720payload', streamUrl: 'https://resolved.example.com/720-2' });
      });

      it('omits 720p streamUrl when slot not resolved', () => {
        const d: Record<string, unknown> = { ...baseData, m720url2: undefined };
        const { mirrors } = mapper.map(dto('episode', url, d));
        const q720 = mirrors?.filter(m => m.quality === '720p') ?? [];
        expect(q720[1].streamUrl).toBeUndefined();
      });

      it('handles string-instead-of-array for hosts', () => {
        const d = { ...baseData, mirror360Host: 'OnlyOne', mirror360Payload: 'onepayload' };
        const { mirrors } = mapper.map(dto('episode', url, d));
        const q360 = mirrors?.filter(m => m.quality === '360p') ?? [];
        expect(q360).toHaveLength(1);
        expect(q360[0].host).toBe('OnlyOne');
        expect(q360[0].payload).toBe('onepayload');
      });

      it('handles missing payload array gracefully (omits payload)', () => {
        const d: Record<string, unknown> = { ...baseData, mirror360Payload: undefined };
        const { mirrors } = mapper.map(dto('episode', url, d));
        const q360 = mirrors?.filter(m => m.quality === '360p') ?? [];
        expect(q360).toHaveLength(2);
        expect(q360[0].payload).toBeUndefined();
      });

      it('handles length mismatch: fewer payloads than hosts', () => {
        const d = { ...baseData, mirror720Payload: ['zip720payload'] }; // 1 payload, 2 hosts
        const { mirrors } = mapper.map(dto('episode', url, d));
        const q720 = mirrors?.filter(m => m.quality === '720p') ?? [];
        expect(q720).toHaveLength(2);
        expect(q720[1].payload).toBeUndefined();
      });

      it('skips empty-string hosts', () => {
        const d = { ...baseData, mirror360Host: ['', 'Valid'], mirror360Payload: ['p1', 'p2'] };
        const { mirrors } = mapper.map(dto('episode', url, d));
        const q360 = mirrors?.filter(m => m.quality === '360p') ?? [];
        expect(q360.every(m => m.host !== '')).toBe(true);
        expect(q360).toHaveLength(1);
        expect(q360[0].host).toBe('Valid');
      });
    });

    describe('episode downloads', () => {
      it('maps download rows with quality, size, host', () => {
        const { downloads } = mapper.map(dto('episode', url, baseData));
        expect(downloads).toHaveLength(3);
        expect(downloads?.[0]).toEqual({
          source: 'otakudesu',
          ownerUrl: url,
          kind: 'episode',
          quality: '360p',
          size: '40 MB',
          host: 'Zippyshare',
          url: 'https://dl1.example.com/ep3-360.mkv',
        });
      });

      it('zips links × hosts within a row', () => {
        const { downloads } = mapper.map(dto('episode', url, baseData));
        const q720 = downloads?.filter(d => d.quality === '720p') ?? [];
        expect(q720).toHaveLength(2);
        expect(q720[0].host).toBe('GDrive');
        expect(q720[1].host).toBe('Mega');
      });

      it('handles absent downloads', () => {
        const d: Record<string, unknown> = { ...baseData, downloads: undefined };
        const { downloads } = mapper.map(dto('episode', url, d));
        expect(downloads).toHaveLength(0);
      });
    });
  });

  // ─── batch ─────────────────────────────────────────────────────────────────

  describe('batch stage', () => {
    const url = 'https://otakudesu.blog/batch/okiraku-batch/';
    const data: Record<string, unknown> = {
      downloads: [
        { quality: '720p', size: '3.2 GB', links: ['https://mega.nz/abc', 'https://gdrive.com/xyz'], hosts: ['Mega', 'GDrive'] },
        { quality: '480p', size: '1.8 GB', links: ['https://mega.nz/def'], hosts: ['Mega'] },
      ],
    };

    it('zips links × hosts per quality row', () => {
      const { downloads } = mapper.map(dto('batch', url, data));
      expect(downloads).toHaveLength(3);
    });

    it('maps first row correctly', () => {
      const { downloads } = mapper.map(dto('batch', url, data));
      expect(downloads?.[0]).toEqual({
        source: 'otakudesu',
        ownerUrl: url,
        kind: 'batch',
        quality: '720p',
        size: '3.2 GB',
        host: 'Mega',
        url: 'https://mega.nz/abc',
      });
      expect(downloads?.[1]).toEqual({
        source: 'otakudesu',
        ownerUrl: url,
        kind: 'batch',
        quality: '720p',
        size: '3.2 GB',
        host: 'GDrive',
        url: 'https://gdrive.com/xyz',
      });
    });

    it('skips empty links', () => {
      const d: Record<string, unknown> = {
        downloads: [{ quality: '720p', links: ['', 'https://valid.com/f'], hosts: ['Bad', 'Good'] }],
      };
      const { downloads } = mapper.map(dto('batch', url, d));
      expect(downloads).toHaveLength(1);
      expect(downloads?.[0].url).toBe('https://valid.com/f');
    });

    it('returns no anime or episode fields', () => {
      const result = mapper.map(dto('batch', url, data));
      expect(result.anime).toBeUndefined();
      expect(result.episode).toBeUndefined();
    });

    it('handles absent downloads array', () => {
      const { downloads } = mapper.map(dto('batch', url, {}));
      expect(downloads).toEqual([]);
    });
  });
});
