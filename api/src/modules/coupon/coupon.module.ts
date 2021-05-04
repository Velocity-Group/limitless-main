import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { AuthModule } from '../auth/auth.module';
import { couponProviders } from './providers';
import { CouponService, CouponSearchService } from './services';
import { AdminCouponController } from './controllers/coupon.controller';
import { UpdateCouponUsesListener } from './listeners/coupon-used-listenter';
import { PerformerModule } from '../performer/performer.module';
@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => PerformerModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PaymentModule)
  ],
  providers: [...couponProviders, CouponService, CouponSearchService, UpdateCouponUsesListener],
  controllers: [AdminCouponController],
  exports: [CouponService, CouponSearchService]
})
export class CouponModule {}
