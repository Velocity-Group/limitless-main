import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { changeTokenLogsProviders } from './providers';
import {
  ChangeTokenLogService
} from './services/change-token-log.service';
import {
  ChangeTokenLogsController
} from './controllers/change-token-log.controller';

@Module({
  imports: [
    MongoDBModule,
    forwardRef(() => AuthModule)
  ],
  providers: [
    ...changeTokenLogsProviders,
    ChangeTokenLogService
  ],
  controllers: [
    ChangeTokenLogsController
  ],
  exports: [
    ...changeTokenLogsProviders,
    ChangeTokenLogService
  ]
})
export class ChangeTokenLogModule {}
