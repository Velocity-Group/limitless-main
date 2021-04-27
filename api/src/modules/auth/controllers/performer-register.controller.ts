import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  UseInterceptors,
  // HttpException,
  forwardRef,
  Inject
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
// import { SettingService } from 'src/modules/settings';
import {
  MultiFileUploadInterceptor,
  FilesUploaded,
  FileDto
} from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { PerformerRegisterPayload } from '../payloads';
import { AuthService } from '../services';

@Controller('auth/performers')
export class PerformerRegisterController {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly authService: AuthService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor(
      [
        {
          type: 'performer-document',
          fieldName: 'idVerification',
          options: {
            destination: getConfig('file').documentDir
          }
        },
        {
          type: 'performer-document',
          fieldName: 'documentVerification',
          options: {
            destination: getConfig('file').documentDir
          }
        }
      ],
      {}
    )
  )
  async performerRegister(
    @Body() payload: PerformerRegisterPayload,
    @FilesUploaded() files: Record<string, FileDto>
  ): Promise<DataResponse<{ message: string }>> {
    try {
      // if (!files.idVerification || !files.documentVerification) {
      //   throw new HttpException('Missing ID documents!', 404);
      // }

      // TODO - define key for performer separately
      // const requireEmailVerification = SettingService.getValueByKey(
      //   'requireEmailVerification'
      // );

      const performer = await this.performerService.register({
        ...payload,
        avatarId: null,
        status: PERFORMER_STATUSES.ACTIVE,
        idVerificationId: files?.idVerification?._id as any,
        documentVerificationId: files?.documentVerification?._id as any
      });

      // create auth, email notification, etc...
      await Promise.all([
        performer.email && this.authService.create({
          source: 'performer',
          sourceId: performer._id,
          type: 'email',
          key: performer.email,
          value: payload.password
        }),
        performer.username && this.authService.create({
          source: 'performer',
          sourceId: performer._id,
          type: 'username',
          key: performer.username,
          value: payload.password
        })
      ]);

      // notify to verify email address
      // TODO - check and verify me!
      performer.email && await this.authService.sendVerificationEmail(performer);

      return DataResponse.ok({ message: 'We have sent you a verification email please check your email account you registered with' });
    } catch (e) {
      files.idVerification
        && (await this.fileService.remove(files.idVerification._id));
      files.documentVerification
        && (await this.fileService.remove(files.documentVerification._id));
      throw e;
    }
  }
}
