import { Test, TestingModule } from '@nestjs/testing';
import { LinkCheckerController } from './link-checker.controller';
import { LinkCheckerService } from './link-checker.service';

describe('LinkCheckerController', () => {
  let linkCheckerController: LinkCheckerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LinkCheckerController],
      providers: [LinkCheckerService],
    }).compile();

    linkCheckerController = app.get<LinkCheckerController>(LinkCheckerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(linkCheckerController.getHello()).toBe('Hello World!');
    });
  });
});
