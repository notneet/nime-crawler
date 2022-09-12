import { Test, TestingModule } from '@nestjs/testing';
import { PostPatternService } from './post-pattern.service';

describe('PostPatternService', () => {
  let service: PostPatternService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostPatternService],
    }).compile();

    service = module.get<PostPatternService>(PostPatternService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
