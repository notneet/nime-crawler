import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { ArchiveConsumer } from './archive.consumer';
import { ArchiveService } from './archive.service';

interface AmqpMessage {
  properties: { headers?: Record<string, unknown> };
}

function msg(rejectedCount?: number): AmqpMessage {
  if (rejectedCount === undefined) return { properties: { headers: {} } };
  return {
    properties: {
      headers: { 'x-death': [{ reason: 'rejected', queue: 'anime.download.archive', count: rejectedCount }] },
    },
  };
}

describe('ArchiveConsumer', () => {
  const job: DownloadJobDto = { episodeId: 5, source: 'otaku' };
  let svc: { handle: jest.Mock };
  let amqp: { publish: jest.Mock };
  let consumer: ArchiveConsumer;

  beforeEach(() => {
    svc = { handle: jest.fn().mockResolvedValue(undefined) };
    amqp = { publish: jest.fn().mockResolvedValue(undefined) };
    const cfg = { get: (_k: string, d?: string) => d } as unknown as ConfigService; // DOWNLOAD_MAX_RETRIES default 3
    consumer = new ArchiveConsumer(
      svc as unknown as ArchiveService,
      amqp as unknown as AmqpConnection,
      cfg,
    );
  });

  it('success -> acks (void), no retry, no parking', async () => {
    const r = await consumer.onJob(job, msg());
    expect(svc.handle).toHaveBeenCalledWith(job);
    expect(r).toBeUndefined();
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('failure on first attempt -> Nack(false) for delayed retry', async () => {
    svc.handle.mockRejectedValue(new Error('boom'));
    const r = await consumer.onJob(job, msg());
    expect(r).toBeInstanceOf(Nack);
    expect((r as Nack).requeue).toBe(false);
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('failure below the retry limit -> Nack(false)', async () => {
    svc.handle.mockRejectedValue(new Error('boom'));
    const r = await consumer.onJob(job, msg(2)); // 2 < 3
    expect(r).toBeInstanceOf(Nack);
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('failure at the retry limit -> park to dlx/download.failed and ack', async () => {
    svc.handle.mockRejectedValue(new Error('boom'));
    const r = await consumer.onJob(job, msg(3)); // 3 >= 3
    expect(amqp.publish).toHaveBeenCalledWith(EXCHANGES.dlx, 'download.failed', job);
    expect(r).toBeUndefined();
  });
});
