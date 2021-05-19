import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, AgendaModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { blockProviders } from './providers';
import { PerformerBlockService } from './services';
import {
  PerformerBlockController
} from './controllers';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongoDBModule,
    AgendaModule.register(),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule)
  ],
  providers: [
    ...blockProviders,
    PerformerBlockService
  ],
  controllers: [
    PerformerBlockController
  ],
  exports: [
    ...blockProviders,
    PerformerBlockService
  ]
})

export class BlockModule {}
