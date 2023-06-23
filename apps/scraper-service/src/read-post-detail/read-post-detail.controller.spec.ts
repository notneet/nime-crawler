import { Test, TestingModule } from '@nestjs/testing';
import { ReadPostDetailController } from './read-post-detail.controller';

describe('ReadPostDetailController', () => {
  let controller: ReadPostDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadPostDetailController],
    }).compile();

    controller = module.get<ReadPostDetailController>(ReadPostDetailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
