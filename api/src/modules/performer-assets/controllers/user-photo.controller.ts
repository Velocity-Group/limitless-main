import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  UseGuards,
  Query,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { STATUS } from 'src/kernel/constants';
import { CurrentUser } from 'src/modules/auth';
import { LoadUser } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { PhotoService } from '../services/photo.service';
import { PhotoSearchService } from '../services/photo-search.service';
import { PhotoSearchRequest } from '../payloads';
import { AuthService } from '../../auth/services';

@Injectable()
@Controller('user/performer-assets/photos')
export class UserPhotosController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly photoSearchService: PhotoSearchService,
    private readonly authService: AuthService
  ) {}

  @Get('/')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() query: PhotoSearchRequest,
    @Request() req: any
  ) {
    // eslint-disable-next-line no-param-reassign
    query.status = STATUS.ACTIVE;
    const auth = req.authUser && { _id: req.authUser.authId, source: req.authUser.source, sourceId: req.authUser.sourceId };
    const jwToken = auth && this.authService.generateJWT(auth, { expiresIn: 4 * 60 * 60 });
    const data = await this.photoSearchService.searchPhotos(query, jwToken);
    return DataResponse.ok(data);
  }

  @Get('/:id/view')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async details(
    @Param('id') id: string,
   @CurrentUser() user: UserDto
  ) {
    const details = await this.photoService.details(id, user);
    return DataResponse.ok(details);
  }

  @Get('/auth/check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(
    @Request() req: any
  ) {
    if (!req.query.token) throw new ForbiddenException();
    const user = await this.authService.getSourceFromJWT(req.query.token);
    if (!user) {
      throw new ForbiddenException();
    }
    const valid = await this.photoService.checkAuth(req, user);
    return DataResponse.ok(valid);
  }
}
