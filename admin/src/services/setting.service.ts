import { ISetting } from 'src/interfaces';
import { APIRequest, IResponse } from './api-request';
import { getGlobalConfig } from './config';

export class SettingService extends APIRequest {
  private _settings = {} as any;

  async public(group = '', forceReload = false): Promise<IResponse<ISetting>> {
    const settingGroup = group || 'all';
    if (this._settings[settingGroup] && !forceReload) {
      return this._settings[settingGroup];
    }
    const resp = await this.get(this.buildUrl('/settings/public', { group }));
    this._settings[settingGroup] = resp;
    return resp;
  }

  all(group = ''): Promise<IResponse<ISetting>> {
    return this.get(this.buildUrl('/admin/settings', { group }));
  }

  update(key: string, value: any) {
    return this.put(`/admin/settings/${key}`, { value });
  }

  getFileUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/admin/settings/files/upload`;
  }

  verifyMailer() {
    return this.post('/mailer/verify');
  }
}

export const settingService = new SettingService();
