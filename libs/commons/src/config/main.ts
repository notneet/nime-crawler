import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { EnvKey } from '../helper/constant';

export enum RMQAckRequired {
  ACK = 1,
  NO_ACK = 0,
}

/**
 * Bug after nest v9:
 * noAck must be true, bug at nest v9?: https://github.com/nestjs/nest/issues/11966#issuecomment-1619622486
 *
 * temporary solution: https://github.com/nestjs/nest/issues/11966#issuecomment-1619735777
 * - Set producer ack to true (set prefectCount at module)
 * - Set consumer ack to false (set prefectCount at main.ts file)
 */
export const queueConfig = (
  config: ConfigService,
  queue: string,
  prefetchCount = 1,
  noAck: RMQAckRequired = RMQAckRequired.ACK,
): RmqOptions => {
  const conf: RmqOptions = {
    transport: Transport.RMQ,
    options: {
      urls: config.get<string>(EnvKey.RMQ_URL)?.split('|'),
      noAck: Boolean(noAck),
      queue,
      prefetchCount,
    },
  };
  if (config.get(EnvKey.APP_ENV, 'production') == 'logging') {
    console.log(conf);
  }

  return conf;
};
