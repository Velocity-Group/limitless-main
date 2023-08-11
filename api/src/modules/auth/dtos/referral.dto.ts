import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ReferralDto {
  _id: ObjectId;

  registerSource: string;

  registerId: ObjectId;

  registerInfo: any;

  referralSource: string;

  referralId: ObjectId;

  referralInfo: any;

  createdAt: Date;

  constructor(data?: Partial<ReferralDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'registerSource',
        'registerId',
        'registerInfo',
        'referralSource',
        'referralId',
        'referralInfo',
        'createdAt'
      ])
    );
  }
}
