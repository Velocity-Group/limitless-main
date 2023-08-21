import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Injectable,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
  Request
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { LoadUser } from 'src/modules/auth/guards';
import { TrendingService } from './trending.service';
import { CurrentUser } from '../auth';
import { UserDto } from '../user/dtos';
import { TrendingSearchPayload } from './trending.payload';
import { AuthService } from '../auth/services';

@Injectable()
@Controller('trending')
export class TrendingController {
  constructor(
    private readonly trendingService: TrendingService,
    private readonly authService: AuthService
  ) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoadUser)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @HttpCode(HttpStatus.OK)
  async list(
    @CurrentUser() user: UserDto,
    @Query() req: TrendingSearchPayload,
    @Request() request: any
  ) {
    const auth = request.authUser && { _id: request.authUser.authId, source: request.authUser.source, sourceId: request.authUser.sourceId };
    const jwToken = request.authUser && this.authService.generateJWT(auth, { expiresIn: 1 * 60 * 60 });
    const stats = await this.trendingService.search(req, user, jwToken);
    return DataResponse.ok(stats);
  }
}
