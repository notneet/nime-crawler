import { Test, TestingModule } from '@nestjs/testing';
import { ReadPostDetailService } from './read-post-detail.service';

describe('ReadPostDetailService', () => {
  let service: ReadPostDetailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadPostDetailService],
    }).compile();

    service = module.get<ReadPostDetailService>(ReadPostDetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
