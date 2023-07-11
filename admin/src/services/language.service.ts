import { APIRequest } from './api-request';

export class LanguageService extends APIRequest {
  create(payload: any) {
    return this.post('/languages', payload);
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/languages', query));
  }

  update(id: string, payload: any) {
    return this.put(`/languages/${id}`, payload);
  }

  delete(id: string) {
    return this.del(`/languages/${id}`);
  }

  locales() {
    return this.get('/locales');
  }

  updateLocale(payload: any) {
    return this.post('/languages/generate', payload);
  }

  exportCsvFile(locale: any) {
    return this.buildUrl(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/languages/${locale}/csv`);
  }

  importCsvFile(
    locale: any,
    file,
    payload: any,
    onProgress?: Function
  ) {
    return this.upload(`/languages/${locale}/csv/import`, [{
      fieldname: 'csv',
      file
    }], {
      onProgress,
      customData: payload
    });
  }
}

export const languageService = new LanguageService();
