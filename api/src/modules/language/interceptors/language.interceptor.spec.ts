import { TestingModule, Test } from '@nestjs/testing';
import { LanguageInterceptor } from './language.interceptor';

describe('LanguageInterceptor', () => {
  let service: LanguageInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LanguageInterceptor]
    }).compile();

    service = module.get<LanguageInterceptor>(LanguageInterceptor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
