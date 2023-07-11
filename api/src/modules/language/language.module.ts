import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { LanguageService } from './language.service';
import { LanguageController } from './language.controller';
import { languageProviders } from './language.provider';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    QueueModule.forRoot(),
    MongoDBModule,
    forwardRef(() => AuthModule),
    forwardRef(() => FileModule)
  ],
  controllers: [LanguageController],
  providers: [LanguageService, ...languageProviders],
  exports: [LanguageService, ...languageProviders]

})
export class LanguageModule { }
