import { ObjectId } from 'mongoose';
import { Expose } from 'class-transformer';

export class LanguageDto {
  @Expose()
  _id: ObjectId;

  @Expose()
  key: string;

  @Expose()
  locale: string;

  @Expose()
  value: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(params) {
    this._id = params._id;
    this.key = params.key;
    this.locale = params.locale;
    this.value = params.value;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
