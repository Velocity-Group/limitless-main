import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { assetsProviders } from './providers';
import { AuthModule } from '../auth/auth.module';
import { TokenPackageSearchService, TokenPackageService } from './services';
import {
  TokenPackageController,
  AdminTokenPackageController
} from './controllers';
import { PerformerModule } from '../performer/performer.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => PerformerModule),
    forwardRef(() => AuthModule)
  ],
  providers: [
    ...assetsProviders,
    TokenPackageService,
    TokenPackageSearchService
  ],
  controllers: [AdminTokenPackageController, TokenPackageController],
  exports: [TokenPackageService, TokenPackageSearchService]
})
export class TokenPackageModule {}
