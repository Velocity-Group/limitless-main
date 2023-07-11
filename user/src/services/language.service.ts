import { APIRequest } from './api-request';

export class LanguageService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/languages', query));
  }

  locales() {
    return this.get('/locales');
  }
}

export const languageService = new LanguageService();
