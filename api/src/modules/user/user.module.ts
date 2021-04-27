import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { userProviders, blockCountryProviders } from './providers';
import {
  UserController,
  AvatarController,
  AdminUserController,
  AdminAvatarController,
  BlockCountryController
} from './controllers';
import { UserService, UserSearchService, BlockCountryService } from './services';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { UserConnectedListener } from './listeners/user-connected.listener';
import { PerformerModule } from '../performer/performer.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => FileModule)
  ],
  providers: [
    ...userProviders,
    ...blockCountryProviders,
    UserService,
    UserSearchService,
    BlockCountryService,
    UserConnectedListener
  ],
  controllers: [
    UserController,
    AvatarController,
    AdminUserController,
    AdminAvatarController,
    BlockCountryController
  ],
  exports: [...userProviders, ...blockCountryProviders, UserService, UserSearchService, BlockCountryService]
})
export class UserModule {}
