import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { userProviders } from './providers';
import {
  UserController,
  AvatarController,
  AdminUserController,
  AdminAvatarController
} from './controllers';
import { UserService, UserSearchService } from './services';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { UserConnectedListener, StripeSettingsUpdatedListener } from './listeners';
import { PerformerModule } from '../performer/performer.module';
import { ChangeTokenLogModule } from '../change-token-logs/change-token-log.module';
import { BlockModule } from '../block/block.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => FileModule),
    forwardRef(() => ChangeTokenLogModule),
    forwardRef(() => BlockModule)
  ],
  providers: [
    ...userProviders,
    UserService,
    UserSearchService,
    UserConnectedListener,
    StripeSettingsUpdatedListener
  ],
  controllers: [
    UserController,
    AvatarController,
    AdminUserController,
    AdminAvatarController
  ],
  exports: [...userProviders, UserService, UserSearchService]
})
export class UserModule {}
