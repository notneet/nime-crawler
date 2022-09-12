import { Test, TestingModule } from '@nestjs/testing';
import { PostPatternController } from './post-pattern.controller';
import { PostPatternService } from './post-pattern.service';

describe('PostPatternController', () => {
  let controller: PostPatternController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostPatternController],
      providers: [PostPatternService],
    }).compile();

    controller = module.get<PostPatternController>(PostPatternController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
