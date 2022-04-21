import { MongoDBModule, QueueModule } from 'src/kernel';
import { Module, forwardRef } from '@nestjs/common';
import { FeedModule } from 'src/modules/feed/feed.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { paymentTokenProviders } from './providers';
import { SettingModule } from '../settings/setting.module';
import { FileModule } from '../file/file.module';
import { MailerModule } from '../mailer/mailer.module';
import {
  TokenTransactionSearchService, TokenTransactionService
} from './services';
import {
  PaymentTokenController, PaymentTokenSearchController
} from './controllers';
import { TokenPackageModule } from '../token-package/token-package.module';
import { SocketModule } from '../socket/socket.module';
import { PaymentTokenListener } from './listeners';
import { SubscriptionModule } from '../subscription/subscription.module';
import { StreamModule } from '../stream/stream.module';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => FileModule),
    forwardRef(() => MailerModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => SocketModule),
    forwardRef(() => FeedModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => StreamModule),
    forwardRef(() => MessageModule)
  ],
  providers: [
    ...paymentTokenProviders,
    TokenTransactionService,
    TokenTransactionSearchService,
    TokenTransactionService,
    PaymentTokenListener
  ],
  controllers: [
    PaymentTokenController,
    PaymentTokenSearchController
  ],
  exports: [
    ...paymentTokenProviders,
    TokenTransactionService,
    TokenTransactionSearchService,
    TokenTransactionService
  ]
})
export class TokenTransactionModule {}
