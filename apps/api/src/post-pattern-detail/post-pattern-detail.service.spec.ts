import { Test, TestingModule } from '@nestjs/testing';
import { PostPatternDetailService } from './post-pattern-detail.service';

describe('PostPatternDetailService', () => {
  let service: PostPatternDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostPatternDetailService],
    }).compile();

    service = module.get<PostPatternDetailService>(PostPatternDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
