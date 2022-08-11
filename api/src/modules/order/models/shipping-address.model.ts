import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class ShippingAddressModel extends Document {
  source: string;

  sourceId: ObjectId;

  name: string;

  country: string;

  state: string;

  city: string;

  district: string;

  ward: string;

  streetNumber: string;

  streetAddress: string;

  zipCode: string;

  description: string;

  createdAt: Date;

  updatedAt: Date;
}
