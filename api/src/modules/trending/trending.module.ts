import { Module, forwardRef } from '@nestjs/common';
import { AgendaModule, MongoDBModule, QueueModule } from 'src/kernel';
import {
  TrendingService
} from './trending.service';
import {
  TrendingController
} from './trending.controller';
import { AuthModule } from '../auth/auth.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { UserModule } from '../user/user.module';
import { FeedModule } from '../feed/feed.module';
import { PerformerModule } from '../performer/performer.module';
import { TrendingListener } from './trending.listener';
import { trendingProviders } from './provider';
import { TrendingRemoveJob } from './trending-remove.job';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => FeedModule)
  ],
  controllers: [
    TrendingController
  ],
  providers: [
    ...trendingProviders,
    TrendingService,
    TrendingListener,
    TrendingRemoveJob
  ],
  exports: []
})
export class TrendingModule {}
