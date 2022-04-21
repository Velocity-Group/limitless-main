import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule, AgendaModule } from 'src/kernel';
import { SubscriptionModule } from 'src/modules/subscription/subscription.module';
import { AuthModule } from '../auth/auth.module';
import { feedProviders, pollProviders, voteProviders } from './providers';
import { FeedFileService, FeedService } from './services';
import {
  PerformerFeedController, FeedFileController, UserFeedController
} from './controllers';
import {
  ReactionFeedListener, CommentFeedListener, PollFeedListener, UpdatePerformerGenderListener,
  DeletePerformerFeedListener,
  StreamFeedListener
} from './listeners';
import { FileModule } from '../file/file.module';
import { PerformerModule } from '../performer/performer.module';
import { ReactionModule } from '../reaction/reaction.module';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => ReactionModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => TokenTransactionModule)
  ],
  providers: [...feedProviders, ...pollProviders, ...voteProviders,
    FeedService, FeedFileService,
    ReactionFeedListener, CommentFeedListener, PollFeedListener,
    UpdatePerformerGenderListener, DeletePerformerFeedListener, StreamFeedListener],
  controllers: [PerformerFeedController, FeedFileController, UserFeedController],
  exports: [...feedProviders, FeedService, FeedFileService]
})
export class FeedModule { }
