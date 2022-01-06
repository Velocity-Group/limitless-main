import { Module, DynamicModule } from '@nestjs/common';
import { QueueModule } from 'src/kernel';
import { SettingModule } from '../settings/setting.module';
import { S3StorageService, S3ConfigurationService } from './services';

@Module({
  imports: [
    QueueModule.forRoot(),
    SettingModule
  ],
  providers: [
    S3ConfigurationService,
    S3StorageService
  ],
  exports: [
    S3StorageService
  ]
})
export class StorageModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: StorageModule
    };
  }
}
