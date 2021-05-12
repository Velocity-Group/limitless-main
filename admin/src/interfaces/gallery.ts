import { ISearch } from './utils';

export interface IGallery {
  _id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  isSale: boolean;
  performerId: string;
  coverPhoto?: { thumbnails: string[]; url: string };
  tagline: string;
}

export interface IGalleryCreate {
  title: string;
  description: string;
  status: string;
  price: number;
  isSale: boolean;
  performerId: string;
  tagline: string;
}

export interface IGalleryUpdate {
  title: string;
  description: string;
  status: string;
  price: number;
  isSale: boolean;
  performerId: string;
  tagline: string;
}

export interface IGallerySearch extends ISearch {
  sort: string;
  sortBy: string;
}
