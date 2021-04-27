import { IGalleryCreate } from 'src/interfaces';
import { APIRequest } from './api-request';

class GalleryService extends APIRequest {
  create(payload: IGalleryCreate) {
    return this.post('/performer/performer-assets/galleries', payload);
  }

  search(param?: any) {
    return this.get(this.buildUrl('/performer/performer-assets/galleries/search', param));
  }

  userSearch(param?: any) {
    return this.get(this.buildUrl('/user/performer-assets/galleries/search', param));
  }

  update(id: string, payload: IGalleryCreate) {
    return this.put(`/performer/performer-assets/galleries/${id}`, payload);
  }

  findById(id: string) {
    return this.get(`/performer/performer-assets/galleries/${id}/view`);
  }

  delete(id: string) {
    return this.del(`/performer/performer-assets/galleries/${id}`);
  }
}

export const galleryService = new GalleryService();
