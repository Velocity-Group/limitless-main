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
import { SettingService } from 'src/modules/settings';
import {
  STATUS_INACTIVE
} from 'src/modules/user/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { AuthGooglePayload, LoginByUsernamePayload } from '../payloads';
import { AuthService } from '../services';
import {
  PasswordIncorrectException,
  EmailNotVerifiedException,
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() req: LoginByUsernamePayload
  ): Promise<DataResponse<{ token: string }>> {
    const query = isEmail(req.username) ? { email: req.username.toLowerCase() } : { username: req.username };
    const [user, performer] = await Promise.all([
      this.userService.findOne(query),
      this.performerService.findOne(query)
    ]);
    if (!user && !performer) {
      throw new HttpException('This account is not found, please sign up', 404);
    }
    if ((user && user.status === STATUS_INACTIVE) || (performer && performer.status === PERFORMER_STATUSES.INACTIVE)) {
      throw new AccountInactiveException();
    }
    const [authUser, authPerformer] = await Promise.all([
      user && this.authService.findBySource({
        source: 'user',
        sourceId: user._id
      }),
      performer && this.authService.findBySource({
        source: 'performer',
        sourceId: performer._id
      })
    ]);
    if (!authUser && !authPerformer) {
      throw new HttpException('This account is not found, please sign up', 404);
    }
    if (authUser && !this.authService.verifyPassword(req.password, authUser)) {
      throw new PasswordIncorrectException();
    }
    if (authPerformer && !this.authService.verifyPassword(req.password, authPerformer)) {
      throw new PasswordIncorrectException();
    }
    const requireEmailVerification = SettingService.getValueByKey(
      SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION
    );
    if ((requireEmailVerification && user && !user.verifiedEmail) || (requireEmailVerification && performer && !performer.verifiedEmail)) {
      throw new EmailNotVerifiedException();
    }
    let token = null;
    // auth token expired in 7d
    if (authUser) {
      token = this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 7 });
    }
    if (!authUser && authPerformer) {
      token = this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 7 });
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
