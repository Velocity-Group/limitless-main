import {
  Module, forwardRef, NestModule, MiddlewareConsumer
} from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { RequestLoggerMiddleware } from 'src/kernel/logger/request-log.middleware';
import { authProviders } from './providers';
import { UserModule } from '../user/user.module';
import { AuthService, VeriffService, ReferralService } from './services';
import { MailerModule } from '../mailer/mailer.module';
import { AuthGuard, RoleGuard, LoadUser } from './guards';
import {
  PerformerRegisterController, PasswordController, LoginController, RegisterController, VeriffController, ReferralController
} from './controllers';
import { FileModule } from '../file/file.module';
import { PerformerModule } from '../performer/performer.module';
import { SettingModule } from '../settings/setting.module';

@Module({
  imports: [
  MongoDBModule,
  forwardRef(() => PerformerModule),
  forwardRef(() => UserModule),
  forwardRef(() => MailerModule),
  forwardRef(() => FileModule),
  forwardRef(() => SettingModule)
  ],
  providers: [
  ...authProviders,
  AuthService,
  ReferralService,
  AuthGuard,
  RoleGuard,
  LoadUser,
  VeriffService
  ],
  controllers: [
  RegisterController,
  LoginController,
  PasswordController,
  PerformerRegisterController,
  VeriffController,
  ReferralController
  ],
  exports: [
  ...authProviders,
  AuthService,
  ReferralService,
  AuthGuard,
  RoleGuard,
  LoadUser
  ]
  })

export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('/veriff/callhook');
  }
}
