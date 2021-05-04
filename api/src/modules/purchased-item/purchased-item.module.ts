import { AgendaModule, MongoDBModule, QueueModule } from 'src/kernel';
import { Module, forwardRef } from '@nestjs/common';
import { FeedModule } from 'src/modules/feed/feed.module';
import { MessageModule } from 'src/modules/message/message.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { paymentTokenProviders } from './providers';
import { SettingModule } from '../settings/setting.module';
import { FileModule } from '../file/file.module';
import { MailerModule } from '../mailer/mailer.module';
import {
  PurchaseItemService,
  PurchasedItemSearchService,
  PaymentTokenService
} from './services';
import {
  PaymentTokenController,
  PaymentTokenSearchController
} from './controllers';
import { TokenPackageModule } from '../token-package/token-package.module';
import { SocketModule } from '../socket/socket.module';
import { PaymentTokenListener } from './listeners';
import { SubscriptionModule } from '../subscription/subscription.module';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => FileModule),
    forwardRef(() => MailerModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => SocketModule),
    forwardRef(() => FeedModule),
    forwardRef(() => MessageModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => StreamModule)
  ],
  providers: [
    ...paymentTokenProviders,
    PurchaseItemService,
    PurchasedItemSearchService,
    PaymentTokenService,
    PaymentTokenListener
  ],
  controllers: [
    PaymentTokenController,
    PaymentTokenSearchController
  ],
  exports: [
    ...paymentTokenProviders,
    PurchaseItemService,
    PurchasedItemSearchService,
    PaymentTokenService
  ]
})
export class PurchasedItemModule {}
