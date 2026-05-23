export interface DownloadJobDto {
  episodeId: number;
  source: string;
  manual?: boolean;
  mirrorId?: number;
  // A direct stream URL to archive (resolved server-side from the episode's own
  // streamUrl). Archived as the lowest-ranked entry. Takes precedence over mirrorId.
  streamUrl?: string;
}
