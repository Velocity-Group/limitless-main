import { ISearch } from './utils';

export interface IGallery {
  _id: string;
  title: string;
  slug: string;
  description: string;
  isSale: boolean;
  status: string;
  price: number;
  performerId: string;
  performer?: any;
  coverPhoto: { thumbnails: string[]; url: string };
  isBookMarked: boolean;
  tagline: string;
  isSubscribed: boolean;
  isBought: boolean;
  numOfItems: number;
}

export interface IGalleryCreate {
  title: string;
  description: string;
  price: number;
  status: string;
  tagline: string;
  isSale: boolean;
}

export interface IGallerySearch extends ISearch {
  sort: string;
  sortBy: string;
}
