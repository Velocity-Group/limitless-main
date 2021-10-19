import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { fileProviders } from './providers';
import { FileController } from './controllers/file.controller';
import {
  FileService, VideoFileService, AudioFileService, ImageService
} from './services';

@Module({
  imports: [
    MongoDBModule,
    forwardRef(() => AuthModule)
  ],
  providers: [
    ...fileProviders,
    FileService,
    ImageService,
    VideoFileService,
    AudioFileService],
  controllers: [FileController],
  exports: [
    ...fileProviders,
    FileService]
})
export class FileModule { }
