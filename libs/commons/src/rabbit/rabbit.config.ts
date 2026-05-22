import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from '../messaging/exchanges';

export function buildRabbitConfig(uri: string): RabbitMQConfig {
  return {
    uri,
    connectionInitOptions: { wait: false },
    defaultPublishOptions: { persistent: true },
    exchanges: [
      { name: EXCHANGES.crawl, type: 'topic' },
      { name: EXCHANGES.parsed, type: 'topic' },
      { name: EXCHANGES.results, type: 'topic' },
      { name: EXCHANGES.dlx, type: 'topic' },
    ],
  };
}
