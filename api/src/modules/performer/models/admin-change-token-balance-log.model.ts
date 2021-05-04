import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class AdminChangeTokenModel extends Document {
  performerId: ObjectId;

  token: Number;

  createdAt: Date;
}
