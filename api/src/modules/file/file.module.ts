import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, AgendaModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { fileProviders } from './providers';
import { FileController } from './controllers/file.controller';
import {
  FileService, VideoFileService, AudioFileService, ImageService
} from './services';
import { SettingModule } from '../settings/setting.module';

@Module({
  imports: [
    MongoDBModule,
    AgendaModule.register(),
    forwardRef(() => AuthModule),
    forwardRef(() => SettingModule)
  ],
  providers: [
    ...fileProviders,
    FileService,
    ImageService,
    VideoFileService,
    AudioFileService
  ],
  controllers: [
    FileController
  ],
  exports: [
    ...fileProviders,
    FileService
  ]
})
export class FileModule { }
