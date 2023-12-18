import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { EnvKey } from '../helper/constant';

export const queueConfig = (
  config: ConfigService,
  queue: string,
  prefetchCount = 1,
): RmqOptions => {
  const conf: RmqOptions = {
    transport: Transport.RMQ,
    options: {
      urls: config.get<string>(EnvKey.RMQ_URL)?.split('|'),
      noAck: false,
      queue,
      prefetchCount,
    },
  };
  if (config.get(EnvKey.NODE_ENV, 'prod') == 'log') {
    console.log(conf);
  }

  return conf;
};
