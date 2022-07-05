import { MongoDBModule, QueueModule } from 'src/kernel';
import {
  Module, forwardRef
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { orderProviders, shippingAddressProviders } from './providers';
import { OrderService, ShippingAddressService } from './services';
import { OrderController, ShippingAddressController } from './controllers';
import { OrderListener } from './listeners';
import { UserModule } from '../user/user.module';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';
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
    forwardRef(() => TokenTransactionModule),
    forwardRef(() => MailerModule),
    forwardRef(() => FileModule)
  ],
  providers: [
    ...orderProviders,
    ...shippingAddressProviders,
    OrderService,
    OrderListener,
    ShippingAddressService
  ],
  controllers: [
    OrderController,
    ShippingAddressController
  ],
  exports: [
    ...orderProviders,
    OrderService
  ]
})
export class OrderModule { }
