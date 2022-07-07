import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { FollowController } from './controllers/follow.controller';
import { FollowService } from './services/follow.service';
import { followProviders } from './providers';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { DeletePerformerFollowListener } from './listeners/user-delete.listener';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    QueueModule.forRoot(),
    MongoDBModule,
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => UserModule)
  ],
  providers: [
    ...followProviders,
    FollowService,
    DeletePerformerFollowListener
  ],
  controllers: [FollowController],
  exports: [FollowService]
})
export class FollowModule {}
