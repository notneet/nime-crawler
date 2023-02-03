import { Test, TestingModule } from '@nestjs/testing';
import { RoutingQueueController } from './routing-queue.controller';
import { RoutingQueueService } from './routing-queue.service';

describe('RoutingQueueController', () => {
  let routingQueueController: RoutingQueueController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RoutingQueueController],
      providers: [RoutingQueueService],
    }).compile();

    routingQueueController = app.get<RoutingQueueController>(RoutingQueueController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(routingQueueController.getHello()).toBe('Hello World!');
    });
  });
});
