import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, AgendaModule } from 'src/kernel';
import { UtilsModule } from 'src/modules/utils/utils.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SettingModule } from '../settings/setting.module';
import { performerProviders } from './providers';
import {
  CategoryService, CategorySearchService, PerformerService, PerformerSearchService
} from './services';
import {
  CategoryController, AdminCategoryController, AdminPerformerController, PerformerController
} from './controllers';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { ReactionModule } from '../reaction/reaction.module';
import { MailerModule } from '../mailer/mailer.module';
import { ChangeTokenLogModule } from '../change-token-logs/change-token-log.module';
import { BlockModule } from '../block/block.module';
import {
  PerformerAssetsListener, PerformerConnectedListener, UpdatePerformerStatusListener
} from './listeners';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    MongoDBModule,
    AgendaModule.register(),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => UtilsModule),
    forwardRef(() => MailerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => ReactionModule),
    forwardRef(() => ChangeTokenLogModule),
    forwardRef(() => BlockModule),
    forwardRef(() => PaymentModule)
  ],
  providers: [
    ...performerProviders,
    CategoryService,
    CategorySearchService,
    PerformerService,
    PerformerSearchService,
    PerformerAssetsListener,
    PerformerConnectedListener,
    UpdatePerformerStatusListener
  ],
  controllers: [
    CategoryController,
    AdminCategoryController,
    AdminPerformerController,
    PerformerController
  ],
  exports: [
    ...performerProviders,
    PerformerService,
    CategoryService,
    PerformerSearchService
  ]
})
export class PerformerModule {}
