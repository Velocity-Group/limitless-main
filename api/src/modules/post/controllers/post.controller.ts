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
  UseInterceptors
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { LanguageInterceptor } from 'src/modules/language/interceptors';
import { I18nLang } from 'src/modules/language/decorator';
import { TranslationService } from 'src/modules/translation/services';
import { pick } from 'lodash';
import { PostService, PostSearchService } from '../services';
import { PostDto } from '../dtos';
import { PostModel } from '../models';
import { UserSearch } from '../payloads';
@Injectable()
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly postSearchService: PostSearchService,
    private readonly translationService: TranslationService
  ) {}

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(LanguageInterceptor)
  async details(
    @Param('id') id: string,
    @I18nLang() locale: string
  ): Promise<DataResponse<PostDto>> {
    const post = await this.postService.getPublic(id);
    if (locale) {
      const translation = (await this.translationService.get({
        sourceId: post._id,
        locale
      })) as any;
      if (translation) {
        return DataResponse.ok(
          Object.assign(
            post,
            pick(translation.toObject(), [
              'title',
              'content',
              'shortDescription'
            ])
          )
        );
      }
    }

    return DataResponse.ok(post);
  }

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userSearch(
    @Query() req: UserSearch
  ): Promise<DataResponse<PageableData<PostModel>>> {
    const post = await this.postSearchService.userSearch(req);
    return DataResponse.ok(post);
  }
}
