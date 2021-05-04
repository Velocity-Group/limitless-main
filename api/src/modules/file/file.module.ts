import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { fileProviders } from './providers';
import { FileController } from './controllers/file.controller';
import { FileService, VideoFileService, AudioFileService } from './services';
import { ImageService } from './services/image.service';

@Module({
  imports: [
    MongoDBModule, forwardRef(() => AuthModule)
  ],
  providers: [...fileProviders, FileService, ImageService, VideoFileService, AudioFileService],
  controllers: [FileController],
  exports: [...fileProviders, FileService, ImageService, VideoFileService, AudioFileService]
})
export class FileModule {}
