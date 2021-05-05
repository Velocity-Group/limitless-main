import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ProductDto {
  _id?: ObjectId;

  performerId?: ObjectId;

  digitalFileId?: ObjectId;

  imageId?: ObjectId;

  image?: any;

  type?: string;

  name?: string;

  description?: string;

  status?: string;

  price?: number;

  stock?: number;

  performer?: any;

  createdBy?: ObjectId;

  updatedBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  isBookMarked?: boolean;

  constructor(init?: Partial<ProductDto>) {
    Object.assign(
      this,
      pick(init, [
        '_id',
        'performerId',
        'digitalFileId',
        'imageId',
        'image',
        'type',
        'name',
        'description',
        'status',
        'price',
        'stock',
        'performer',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        'isBookMarked'
      ])
    );
  }

  toPublic() {
    return {
      _id: this._id,
      performerId: this.performerId,
      digitalFileId: this.digitalFileId,
      image: this.image,
      type: this.type,
      name: this.name,
      description: this.description,
      status: this.status,
      price: this.price,
      stock: this.stock,
      performer: this.performer,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isBookMarked: this.isBookMarked
    };
  }
}
