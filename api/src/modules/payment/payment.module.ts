import { MongoDBModule, QueueModule } from 'src/kernel';
import {
  Module, forwardRef, NestModule, MiddlewareConsumer
} from '@nestjs/common';
import { CouponModule } from 'src/modules/coupon/coupon.module';
import { RequestLoggerMiddleware } from 'src/kernel/logger/request-log.middleware';
import { TokenPackageModule } from 'src/modules/token-package/token-package.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { paymentProviders } from './providers';
import { SettingModule } from '../settings/setting.module';
import { MailerModule } from '../mailer/mailer.module';
import {
  CCBillService, PaymentService, PaymentSearchService,
  BitpayService, StripeService
} from './services';
import {
  PaymentController, PaymentSearchController, CancelSubscriptionController, PaymentWebhookController,
  StripeController
} from './controllers';
import { TransactionMailerListener, UpdateUserBalanceListener } from './listeners';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    SocketModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => CouponModule),
    forwardRef(() => MailerModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => SubscriptionModule)
  ],
  providers: [
    ...paymentProviders,
    PaymentService,
    CCBillService,
    BitpayService,
    StripeService,
    PaymentSearchService,
    TransactionMailerListener,
    UpdateUserBalanceListener
  ],
  controllers: [
    PaymentController, PaymentSearchController, StripeController,
    CancelSubscriptionController, PaymentWebhookController
  ],
  exports: [
    ...paymentProviders,
    PaymentService,
    StripeService,
    PaymentSearchService
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
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('/payment/stripe/callhook');
  }
}
