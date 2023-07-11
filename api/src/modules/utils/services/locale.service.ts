import { Injectable } from '@nestjs/common';
import { compact, flatten, uniqBy } from 'lodash';
import { SearchRequest } from 'src/kernel';
import CountryLanguage from '../constants/country-language';
import { LanguageService } from './language.service';

@Injectable()
export class LocaleService {
  constructor(private readonly languageService: LanguageService) { }

  search(payload: SearchRequest) {
    const { languages } = CountryLanguage;
    let langCultureMs = flatten(
      compact(languages.map((data) => data.langCultureMs))
    );
    const languageList = this.languageService.getList();

    if (payload.q) {
      const locales = langCultureMs.map((lang) => lang.langCultureName);
      return [...locales, ...languageList.map((lng) => lng.code)];
    }

    langCultureMs = [
      ...langCultureMs,
      ...languageList.map((lng) => ({
        langCultureName: lng.code,
        displayName: lng.name,
        cultureCode: lng.code
      }))
    ];
    return uniqBy(langCultureMs, 'langCultureName');
  }
}
