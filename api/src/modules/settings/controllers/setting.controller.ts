import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseInterceptors
} from '@nestjs/common';
import { DataResponse } from 'src/kernel';
import { I18nLang } from 'src/modules/language/decorator';
import { LanguageInterceptor } from 'src/modules/language/interceptors/language.interceptor';
import { TranslationService } from 'src/modules/translation/services';
import { omit } from 'lodash';
import { SettingService, MenuService } from '../services';

@Injectable()
@Controller('settings')
export class SettingController {
  constructor(
    private readonly menuService: MenuService,
    private readonly settingService: SettingService,
    private readonly translationService: TranslationService
  ) {}

  @Get('/public')
  @UseInterceptors(LanguageInterceptor)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPublicSettings(@I18nLang() locale: string): Promise<DataResponse<Map<string, any>>> {
    const menus = await this.menuService.getPublicMenus();
    const settings = await this.settingService.getPublicSettingsArray();
    if (locale) {
      const sourceIds = [
        ...menus.map((m) => m._id),
        ...settings.map((s) => s._id)
      ];
      const translatedData = await this.translationService.getListByIds({
        sourceIds,
        locale
      }) as any;

      menus.forEach((menu) => {
        const translatedMenu = translatedData.find((tm) => tm.sourceId.toString() === menu._id.toString());
        if (translatedMenu?.title) {
          // eslint-disable-next-line no-param-reassign
          menu.title = translatedMenu.title;
        }
      });
      settings.forEach((s) => {
        const translatedText = translatedData.find((tm) => tm.sourceId.toString() === s._id.toString());
        if (translatedText?.value) {
          // eslint-disable-next-line no-param-reassign
          s.value = s.type === 'text-editor' ? translatedText.value.html : translatedText.value;
        }
      });
    }

    const publicSettings = {
      // dont need id and parent id for now
      menus: menus.map((m) => omit(m, ['_id', 'parentId']))
    } as any;
    settings.forEach((setting) => {
      publicSettings[setting.key] = setting.value;
    });

    return DataResponse.ok(publicSettings);
  }
}
