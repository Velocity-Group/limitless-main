export interface IProduct {
  _id?: string;
  performerId?: string;
  digitalFileId?: string;
  imageId?: string;
  image?: any;
  type?: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  stock?: number;
  performer?: any;
  createdAt?: Date;
  updatedAt?: Date;
  quantity?: number;
  isBookMarked?: boolean;
}

export interface IProductCreate {
  name: string;
  description?: string;
  status: string;
  type: string;
  price: number;
  stock: number;
}
