import { Test, TestingModule } from '@nestjs/testing';
import { ReadPostService } from './read-post.service';

describe('ReadPostService', () => {
  let service: ReadPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadPostService],
    }).compile();

    service = module.get<ReadPostService>(ReadPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
