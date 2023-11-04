import { Test, TestingModule } from '@nestjs/testing';
import { PostPatternDetailController } from './post-pattern-detail.controller';
import { PostPatternDetailService } from './post-pattern-detail.service';

describe('PostPatternDetailController', () => {
  let controller: PostPatternDetailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostPatternDetailController],
      providers: [PostPatternDetailService],
    }).compile();

    controller = module.get<PostPatternDetailController>(
      PostPatternDetailController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
