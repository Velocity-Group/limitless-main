import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  HttpException,
  Get,
  Query,
  forwardRef,
  Inject
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
// import { SettingService } from 'src/modules/settings';
import {
  // STATUS_PENDING_EMAIL_CONFIRMATION,
  STATUS_INACTIVE
} from 'src/modules/user/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { AuthGooglePayload, LoginByEmailPayload, LoginByUsernamePayload } from '../payloads';
import { AuthService } from '../services';
import {
  EmailOrPasswordIncorrectException,
  // EmailNotVerifiedException,
  UsernameOrPasswordIncorrectException,
  AccountInactiveException
} from '../exceptions';

@Controller('auth')
export class LoginController {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  public async loginByEmail(
    @Body() req: LoginByEmailPayload
  ): Promise<DataResponse<{ token: string }>> {
    const [user, performer] = await Promise.all([
      this.userService.findByEmail(req.email),
      this.performerService.findOne({ email: req.email })
    ]);
    if (!user && !performer) {
      throw new HttpException('This account is not found. Please sign up', 404);
    }
    if ((user && user.status === STATUS_INACTIVE) || (performer && performer.status === PERFORMER_STATUSES.INACTIVE)) {
      throw new AccountInactiveException();
    }
    const [authUser, authPerformer] = await Promise.all([
      user && this.authService.findBySource({
        source: 'user',
        sourceId: user._id,
        type: 'email'
      }),
      performer && this.authService.findBySource({
        source: 'performer',
        sourceId: performer._id,
        type: 'email'
      })
    ]);
    if (!authUser && !authPerformer) {
      throw new HttpException('This account is not found. Please Sign up', 404);
    }
    if (authUser && !this.authService.verifyPassword(req.password, authUser)) {
      throw new EmailOrPasswordIncorrectException();
    }
    if (authPerformer && !this.authService.verifyPassword(req.password, authPerformer)) {
      throw new EmailOrPasswordIncorrectException();
    }
    // TODO - check for user status here

    let token = null;
    // auth token expired in 30d
    if (authUser) {
      token = this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 30 });
    }
    if (!authUser && authPerformer) {
      token = this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 30 });
    }

    return DataResponse.ok({ token });
  }

  @Post('login/username')
  @HttpCode(HttpStatus.OK)
  public async loginByUsername(
    @Body() req: LoginByUsernamePayload
  ): Promise<DataResponse<{ token: string }>> {
    const [user, performer] = await Promise.all([
      this.userService.findByUsername(req.username),
      this.performerService.findOne({ username: req.username })
    ]);
    if (!user && !performer) {
      throw new HttpException('This account is not found. Please Sign up', 404);
    }
    if ((user && user.status === STATUS_INACTIVE) || (performer && performer.status === PERFORMER_STATUSES.INACTIVE)) {
      throw new AccountInactiveException();
    }
    const [authUser, authPerformer] = await Promise.all([
      user && this.authService.findBySource({
        source: 'user',
        sourceId: user._id,
        type: 'username'
      }),
      performer && this.authService.findBySource({
        source: 'performer',
        sourceId: performer._id,
        type: 'username'
      })
    ]);
    if (!authUser && !authPerformer) {
      throw new HttpException('This account is not found. Please Sign up', 404);
    }
    if (authUser && !this.authService.verifyPassword(req.password, authUser)) {
      throw new UsernameOrPasswordIncorrectException();
    }
    if (authPerformer && !this.authService.verifyPassword(req.password, authPerformer)) {
      throw new UsernameOrPasswordIncorrectException();
    }
    let token = null;
    // auth token expired in 30d
    if (authUser) {
      token = this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 30 });
    }
    if (!authUser && authPerformer) {
      token = this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 30 });
    }

    return DataResponse.ok({ token });
  }

  @Get('twitter/login')
  @HttpCode(HttpStatus.OK)
  public async twitterLogin(
  // @Request() req: any
  ): Promise<DataResponse<any>> {
    const resp = await this.authService.loginTwitter();
    return DataResponse.ok(resp);
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  public async googleLogin(
    @Body() payload: AuthGooglePayload
  ): Promise<DataResponse<any>> {
    const resp = await this.authService.verifyLoginGoogle(payload);
    return DataResponse.ok(resp);
  }

  @Get('twitter/callback')
  @HttpCode(HttpStatus.OK)
  public async twitterCallback(
    @Query() req: any
  ): Promise<DataResponse<any>> {
    const resp = await this.authService.twitterLoginCallback(req);
    return DataResponse.ok(resp);
  }
}
