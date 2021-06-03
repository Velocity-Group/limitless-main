import { APIRequest } from './api-request';

export class ReportService extends APIRequest {
  search(data) {
    return this.get(this.buildUrl('/reports', data));
  }
}

export const reportService = new ReportService();
