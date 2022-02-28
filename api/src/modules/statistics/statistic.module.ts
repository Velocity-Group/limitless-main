import { Module, forwardRef } from '@nestjs/common';
import {
  StatisticService
} from './services/statistic.service';
import {
  StatisticController
} from './controllers/statistics.controller';
import { AuthModule } from '../auth/auth.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { PerformerModule } from '../performer/performer.module';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { EarningModule } from '../earning/earning.module';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';
import { FeedModule } from '../feed/feed.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => EarningModule),
    forwardRef(() => TokenTransactionModule),
    forwardRef(() => FeedModule),
    forwardRef(() => OrderModule)
  ],
  controllers: [
    StatisticController
  ],
  providers: [
    StatisticService
  ],
  exports: [StatisticService]
})
export class StatisticsModule {}
