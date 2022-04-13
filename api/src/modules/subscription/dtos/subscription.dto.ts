import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class SubscriptionDto {
  _id: ObjectId;

  subscriptionType: string;

  userId: ObjectId;

  performerId: ObjectId;

  subscriptionId: string;

  transactionId: ObjectId;

  paymentGateway: string;

  status: string;

  meta: any;

  startRecurringDate: Date;

  nextRecurringDate: Date;

  createdAt: Date;

  updatedAt: Date;

  expiredAt: Date;

  userInfo: any;

  performerInfo: any;

  constructor(data: Partial<SubscriptionDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'subscriptionType',
        'userInfo',
        'userId',
        'performerId',
        'performerInfo',
        'subscriptionId',
        'transactionId',
        'paymentGateway',
        'status',
        'meta',
        'startRecurringDate',
        'nextRecurringDate',
        'expiredAt',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse(includePrivateInfo = false) {
    const publicInfo = {
      _id: this._id,
      subscriptionType: this.subscriptionType,
      userId: this.userId,
      userInfo: this.userInfo,
      performerId: this.performerId,
      performerInfo: this.performerInfo,
      status: this.status,
      expiredAt: this.expiredAt,
      startRecurringDate: this.startRecurringDate,
      nextRecurringDate: this.nextRecurringDate,
      paymentGateway: this.paymentGateway
    };

    const privateInfo = {
      subscriptionId: this.subscriptionId,
      transactionId: this.transactionId,
      meta: this.meta
    };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return { ...publicInfo, ...privateInfo };
  }
}
