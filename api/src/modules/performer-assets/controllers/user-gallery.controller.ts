import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Get,
  Query,
  UseGuards,
  Res,
  Post,
  Request
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { AuthGuard, LoadUser } from 'src/modules/auth/guards';
import { CurrentUser } from 'src/modules/auth';
import { GallerySearchRequest } from '../payloads';
import { GalleryService } from '../services/gallery.service';

@Injectable()
@Controller('user/performer-assets/galleries')
export class UserGalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('/search')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchGallery(
    @Query() query: GallerySearchRequest,
    @CurrentUser() user: any,
    @Request() req: any
  ): Promise<any> {
    const resp = await this.galleryService.userSearch(query, user, req.jwToken);
    return DataResponse.ok(resp);
  }

  @Get('/:id/view')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async view(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<any> {
    const resp = await this.galleryService.details(id, user);
    return DataResponse.ok(resp);
  }

  @Post('/:id/download-zip')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async download(
    @Res() res: any,
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<any> {
    const resp = await this.galleryService.downloadZipPhotos(id, user);
    return DataResponse.ok(resp);
  }
}
