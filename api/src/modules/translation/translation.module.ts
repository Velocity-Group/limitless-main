import { forwardRef, Module } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { TranslationService } from './services';
import { provider } from './providers';
import { TranslationController } from './controllers';

@Module({
  imports: [MongoDBModule, QueueModule.forRoot(), forwardRef(() => AuthModule)],
  exports: [TranslationService],
  controllers: [TranslationController],
  providers: [...provider, TranslationService]
})
export class TranslationModule { }
