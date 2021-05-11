import { MongoDBModule, QueueModule } from 'src/kernel';
import {
  Module, forwardRef
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { orderProviders } from './providers';
import { OrderService } from './services';
import { OrderController } from './controllers';
import { OrderListener } from './listeners';
import { UserModule } from '../user/user.module';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { MailerModule } from '../mailer/mailer.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => PurchasedItemModule),
    forwardRef(() => MailerModule),
    forwardRef(() => FileModule)
  ],
  providers: [
    ...orderProviders,
    OrderService,
    OrderListener
  ],
  controllers: [OrderController],
  exports: [
    ...orderProviders,
    OrderService,
    OrderListener
  ]
})
export class OrderModule {}
