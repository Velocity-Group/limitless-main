import { MongoDBModule, QueueModule } from 'src/kernel';
import { FeedModule } from 'src/modules/feed/feed.module';
import {
  Module, forwardRef, NestModule, MiddlewareConsumer
} from '@nestjs/common';
import { CouponModule } from 'src/modules/coupon/coupon.module';
import { RequestLoggerMiddleware } from 'src/kernel/logger/request-log.middleware';
import { TokenPackageModule } from 'src/modules/token-package/token-package.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { paymentProviders, orderProviders } from './providers';
import { SettingModule } from '../settings/setting.module';
import { EarningModule } from '../earning/earning.module';
import { MessageModule } from '../message/message.module';
import { FileModule } from '../file/file.module';
import { MailerModule } from '../mailer/mailer.module';
import {
  CCBillService, PaymentService, PaymentSearchService, CheckPaymentService,
  OrderService, BitpayService
} from './services';
import { PaymentController, PaymentSearchController, OrderController } from './controllers';
import { OrderListener, TransactionMailerListener, UpdateUserBalanceListener } from './listeners';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => EarningModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => CouponModule),
    forwardRef(() => FileModule),
    forwardRef(() => MailerModule),
    forwardRef(() => FeedModule),
    forwardRef(() => MessageModule),
    forwardRef(() => TokenPackageModule)
  ],
  providers: [
    ...paymentProviders,
    ...orderProviders,
    PaymentService,
    CCBillService,
    BitpayService,
    PaymentSearchService,
    CheckPaymentService,
    OrderService,
    OrderListener,
    TransactionMailerListener,
    UpdateUserBalanceListener
  ],
  controllers: [PaymentController, PaymentSearchController, OrderController],
  exports: [
    ...paymentProviders,
    ...orderProviders,
    PaymentService,
    PaymentSearchService,
    CheckPaymentService,
    OrderService,
    OrderListener
  ]
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('/payment/ccbill/callhook');
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('/payment/bitpay/callhook');
  }
}
