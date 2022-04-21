import { Module, forwardRef, HttpModule } from '@nestjs/common';
import * as https from 'https';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { SubscriptionModule } from 'src/modules/subscription/subscription.module';
import { assetsProviders } from './providers/stream.provider';
import { PerformerModule } from '../performer/performer.module';
import { AuthModule } from '../auth/auth.module';
import { StreamService, AgoraService } from './services';
import { AgoraController, StreamController } from './controllers';
import { MessageModule } from '../message/message.module';
import { SocketModule } from '../socket/socket.module';
import { PublicStreamWsGateway } from './gateways';
import { StreamConnectListener } from './listeners';
import { SettingModule } from '../settings/setting.module';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';

const agent = new https.Agent({
  rejectUnauthorized: process.env.REJECT_UNAUTHORIZED !== 'false'
});

@Module({
  imports: [
    MongoDBModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
      httpsAgent: agent
    }),
    QueueModule.forRoot(),
    forwardRef(() => UserModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => MessageModule),
    forwardRef(() => SocketModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => MessageModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => TokenTransactionModule)
  ],
  providers: [
    ...assetsProviders,
    StreamService,
    AgoraService,
    StreamConnectListener,
    PublicStreamWsGateway
  ],
  controllers: [StreamController, AgoraController],
  exports: [StreamService]
})
export class StreamModule {}
