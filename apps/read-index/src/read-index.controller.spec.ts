import { Test, TestingModule } from '@nestjs/testing';
import { ReadIndexController } from './read-index.controller';
import { ReadIndexService } from './read-index.service';

describe('ReadIndexController', () => {
  let readIndexController: ReadIndexController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReadIndexController],
      providers: [ReadIndexService],
    }).compile();

    readIndexController = app.get<ReadIndexController>(ReadIndexController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(readIndexController.getHello()).toBe('Hello World!');
    });
  });
});
