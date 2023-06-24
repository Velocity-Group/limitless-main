import { Module, DynamicModule } from '@nestjs/common';
import { QueueModule } from 'src/kernel';
import { SettingModule } from '../settings/setting.module';
import {
  AwsS3storageService, AwsS3ConfigurationService, GCSstorageService
} from './services';

@Module({
  imports: [
    QueueModule.forRoot(),
    SettingModule
  ],
  providers: [
    AwsS3ConfigurationService,
    AwsS3storageService,
    GCSstorageService
  ],
  exports: [
    AwsS3storageService,
    GCSstorageService
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
