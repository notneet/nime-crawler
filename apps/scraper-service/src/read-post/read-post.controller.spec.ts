import { Test, TestingModule } from '@nestjs/testing';
import { ReadPostController } from './read-post.controller';

describe('ReadPostController', () => {
  let controller: ReadPostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadPostController],
    }).compile();

    controller = module.get<ReadPostController>(ReadPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
