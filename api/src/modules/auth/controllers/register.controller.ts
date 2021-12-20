import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  Get,
  Res,
  Query,
  forwardRef,
  Inject,
  Param
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
import { UserCreatePayload } from 'src/modules/user/payloads';
import { STATUS_ACTIVE, ROLE_USER } from 'src/modules/user/constants';
import { Response } from 'express';
import { AuthCreateDto } from '../dtos';
import { UserRegisterPayload, EmailVerificationPayload } from '../payloads';
import { AuthService } from '../services';

@Controller('auth')
export class RegisterController {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Post('users/register')
  @HttpCode(HttpStatus.OK)
  async userRegister(
    @Body() req: UserRegisterPayload
  ): Promise<DataResponse<{ message: string }>> {
    const user = await this.userService.create(new UserCreatePayload(req), {
      status: STATUS_ACTIVE,
      roles: ROLE_USER
    });
    await Promise.all([
      req.email && this.authService.create(new AuthCreateDto({
        source: 'user',
        sourceId: user._id,
        type: 'email',
        value: req.password,
        key: req.email
      })),
      req.username && this.authService.create(new AuthCreateDto({
        source: 'user',
        sourceId: user._id,
        type: 'username',
        value: req.password,
        key: req.username
      }))
    ]);
    // if require for email verification, we will send verification email
    user.email && await this.authService.sendVerificationEmail(user);
    return DataResponse.ok({
      message: 'Please check your inbox and verify your email address'
    });
  }

  @Post('email-verification')
  @HttpCode(HttpStatus.OK)
  async emailVerify(
    @Body() payload: EmailVerificationPayload
  ): Promise<DataResponse<{ message: string }>> {
    await this.authService.sendVerificationEmail(payload.source);
    return DataResponse.ok({
      message: 'We have sent you a verification email please check your email account you registered with'
    });
  }

  @Get('email-verification')
  public async verifyEmail(
    @Res() res: Response,
    @Query('token') token: string
  ) {
    if (!token) {
      return res.render('404.html');
    }
    await this.authService.verifyEmail(token);
    if (process.env.EMAIL_VERIFIED_SUCCESS_URL) {
      return res.redirect(process.env.EMAIL_VERIFIED_SUCCESS_URL);
    }
    return res.redirect(`${process.env.USER_URL}`);
  }

  @Post('users/:id/switch-to-performer')
  @HttpCode(HttpStatus.OK)
  async userSwitchAccount(
    @Param('id') userId: string
  ): Promise<DataResponse<{ message: string }>> {
    await this.authService.switchUserAccount(userId);
    return DataResponse.ok({ message: 'Your user account switched to become a model!' });
  }
}
