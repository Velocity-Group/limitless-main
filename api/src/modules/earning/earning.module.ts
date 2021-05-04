import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { PurchasedItemModule } from 'src/modules/purchased-item/purchased-item.module';
import { SocketModule } from '../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PaymentModule } from '../payment/payment.module';
import { SettingModule } from '../settings/setting.module';
import { EarningController } from './controllers/earning.controller';
import { EarningService } from './services/earning.service';
import { earningProviders } from './providers/earning.provider';
import { TransactionEarningListener, HandleDeleteItemListener } from './listeners';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongoDBModule,
    SocketModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PurchasedItemModule)
  ],
  providers: [...earningProviders, EarningService, TransactionEarningListener, HandleDeleteItemListener],
  controllers: [EarningController],
  exports: [...earningProviders, EarningService]
})
export class EarningModule {}
