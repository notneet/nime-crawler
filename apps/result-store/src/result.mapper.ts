import { ParsedResultDto } from '@libs/commons/messaging/parsed-result.dto';

export interface AnimeInput {
  source: string;
  url: string;
  slug: string;
  title?: string;
  titleJP?: string;
  thumbnailUrl?: string;
  type?: string;
  status?: string;
  score?: string;
  duration?: string;
  totalEpisodes?: string;
  studio?: string;
  producers?: string;
  releaseDate?: string;
  synopsis?: string;
  raw?: Record<string, unknown> | null;
}

export interface EpisodeInput {
  source: string;
  url: string;
  animeUrl?: string;
  number?: string;
  title?: string;
  streamUrl?: string;
  streamFallback?: string;
  postedBy?: string;
  releaseInfo?: string;
  raw?: Record<string, unknown> | null;
}

export interface MirrorInput {
  episodeUrl: string;
  quality: string;
  host: string;
  payload?: string;
  streamUrl?: string;
}

export interface DownloadInput {
  source: string;
  ownerUrl: string;
  kind: 'episode' | 'batch';
  quality?: string;
  host?: string;
  size?: string;
  url: string;
}

export interface MappedResult {
  anime?: AnimeInput;
  genres?: string[];
  episode?: EpisodeInput;
  mirrors?: MirrorInput[];
  downloads?: DownloadInput[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function slug(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).pop() ?? url;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') return [v];
  return [];
}

function stripPrefix(v: unknown, prefix: string): string | undefined {
  const s = asString(v);
  if (s === undefined) return undefined;
  const stripped = s.replace(new RegExp(`^${prefix}\\s*`, 'i'), '').trim();
  return stripped.length > 0 ? stripped : undefined;
}

// ─── mapper ───────────────────────────────────────────────────────────────────

export class ResultMapper {
  map(result: ParsedResultDto): MappedResult {
    switch (result.stage) {
      case 'index':
        return {};
      case 'detail':
        return this.mapDetail(result);
      case 'episode':
        return this.mapEpisode(result);
      case 'batch':
        return this.mapBatch(result);
    }
  }

  private mapDetail(result: ParsedResultDto): MappedResult {
    const d = result.data;
    const anime: AnimeInput = {
      source: result.source,
      url: result.url,
      slug: slug(result.url),
      raw: d,
    };

    const str = (key: string): string | undefined => asString(d[key]);

    const maybeSet = <K extends keyof AnimeInput>(key: K, value: string | undefined): void => {
      if (value !== undefined) (anime as unknown as Record<string, unknown>)[key] = value;
    };

    maybeSet('title', str('title'));
    maybeSet('titleJP', str('titleJP'));
    maybeSet('thumbnailUrl', str('thumbnailUrl'));
    maybeSet('type', str('type'));
    maybeSet('status', str('status'));
    maybeSet('score', str('score'));
    maybeSet('duration', str('duration'));
    maybeSet('totalEpisodes', str('totalEpisodes'));
    maybeSet('studio', str('studio'));
    maybeSet('producers', str('producers'));
    maybeSet('releaseDate', str('releaseDate'));
    maybeSet('synopsis', str('synopsis'));

    const genres = asStringArray(d['genres']);

    return { anime, genres };
  }

  private mapEpisode(result: ParsedResultDto): MappedResult {
    const d = result.data;
    const url = result.url;

    const numberMatch = url.match(/episode-(\d+)/);
    const number = numberMatch ? numberMatch[1] : undefined;

    const episode: EpisodeInput = {
      source: result.source,
      url,
      raw: d,
    };

    if (number !== undefined) episode.number = number;
    const t = asString(d['title']);
    if (t !== undefined) episode.title = t;
    const sv = asString(d['streamUrl']);
    if (sv !== undefined) episode.streamUrl = sv;
    const au = asString(d['animeUrl']);
    if (au !== undefined) episode.animeUrl = au;

    // .kategoz spans: ["Posted by <user>", "Release on <time>"] — strip the labels.
    const kategoz = asStringArray(d['kategoz']);
    const postedBy = stripPrefix(kategoz[0], 'Posted by');
    if (postedBy !== undefined) episode.postedBy = postedBy;
    const releaseInfo = stripPrefix(kategoz[1], 'Release on');
    if (releaseInfo !== undefined) episode.releaseInfo = releaseInfo;

    const mirrors = this.buildMirrors(url, d);
    const downloads = rowsToDownloads(result.source, url, 'episode', d['downloads']);

    return { episode, mirrors, downloads };
  }

  private buildMirrors(episodeUrl: string, d: Record<string, unknown>): MirrorInput[] {
    const qualities: Array<{ quality: string; hostKey: string; payloadKey: string }> = [
      { quality: '360p', hostKey: 'mirror360Host', payloadKey: 'mirror360Payload' },
      { quality: '480p', hostKey: 'mirror480Host', payloadKey: 'mirror480Payload' },
      { quality: '720p', hostKey: 'mirror720Host', payloadKey: 'mirror720Payload' },
    ];

    const mirrors: MirrorInput[] = [];

    for (const { quality, hostKey, payloadKey } of qualities) {
      const hosts = asStringArray(d[hostKey]);
      const payloads = asStringArray(d[payloadKey]);

      for (let i = 0; i < hosts.length; i++) {
        const host = hosts[i];
        if (!host) continue;
        const payload = payloads[i];
        const mirror: MirrorInput = { episodeUrl, quality, host };
        if (payload !== undefined) mirror.payload = payload;
        // Only 720p mirrors are clicked-and-resolved: slot i -> m720url{i+1}.
        if (quality === '720p') {
          const resolved = asString(d[`m720url${i + 1}`]);
          if (resolved !== undefined) mirror.streamUrl = resolved;
        }
        mirrors.push(mirror);
      }
    }

    return mirrors;
  }

  private mapBatch(result: ParsedResultDto): MappedResult {
    const downloads = rowsToDownloads(result.source, result.url, 'batch', result.data['downloads']);
    return { downloads };
  }
}

// Episode and batch share the same download-row shape: { quality, size, hosts[], links[] }.
function rowsToDownloads(
  source: string,
  ownerUrl: string,
  kind: 'episode' | 'batch',
  rawRows: unknown,
): DownloadInput[] {
  const downloads: DownloadInput[] = [];
  if (!Array.isArray(rawRows)) return downloads;

  for (const rawRow of rawRows) {
    if (typeof rawRow !== 'object' || rawRow === null) continue;
    const row = rawRow as Record<string, unknown>;
    const quality = asString(row['quality']);
    const size = asString(row['size']);
    const links = asStringArray(row['links']);
    const hosts = asStringArray(row['hosts']);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (!link) continue;
      const entry: DownloadInput = { source, ownerUrl, kind, url: link };
      if (quality !== undefined) entry.quality = quality;
      if (size !== undefined) entry.size = size;
      const host = hosts[i];
      if (host !== undefined) entry.host = host;
      downloads.push(entry);
    }
  }

  return downloads;
}
