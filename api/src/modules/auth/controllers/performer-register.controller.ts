import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  forwardRef,
  Inject
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { FileService } from 'src/modules/file/services';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { PerformerRegisterPayload } from '../payloads';
import { AuthService, ReferralService } from '../services';

@Controller('auth/performers')
export class PerformerRegisterController {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly authService: AuthService,
    private readonly referralService: ReferralService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async performerRegister(
    @Body() payload: PerformerRegisterPayload
  ): Promise<DataResponse<{ message: string }>> {
    const performer = await this.performerService.register({
      ...payload,
      status: PERFORMER_STATUSES.ACTIVE
    });

    // const performer = await this.performerService.register({
    //   ...payload,
    //   avatarId: null,
    //   status: PERFORMER_STATUSES.ACTIVE,
    //   idVerificationId: files?.idVerification?._id,
    //   documentVerificationId: files?.documentVerification?._id
    // } as any);

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
    // track referral
    if (payload.rel) {
      await this.referralService.newReferral({
        registerSource: 'performer',
        registerId: performer._id,
        code: payload.rel
      });
    }
    // notify to verify email address
    performer.email && await this.authService.sendVerificationEmail(performer);

    return DataResponse.ok({ message: `Your application will be processed withing 24 to 48 hours, most times sooner. You will get an email notification sent to ${performer.email || 'your email address'} with the status update.` });
  }
}
