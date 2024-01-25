import { Test, TestingModule } from '@nestjs/testing';
import { CronIntervalController } from './cron-interval.controller';
import { CronIntervalService } from './cron-interval.service';

describe('CronIntervalController', () => {
  let cronIntervalController: CronIntervalController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CronIntervalController],
      providers: [CronIntervalService],
    }).compile();

    cronIntervalController = app.get<CronIntervalController>(CronIntervalController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(cronIntervalController.getHello()).toBe('Hello World!');
    });
  });
});
