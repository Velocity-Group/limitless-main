import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class ReportDto {
  _id?: ObjectId;

  description: string;

  source: string;

  sourceId: ObjectId;

  sourceInfo?: any;

  performerId: ObjectId;

  performerInfo?: any;

  target: string;

  targetId: ObjectId;

  targetInfo?: any;

  createdAt: Date;

  updatedAt: Date;

  constructor(data?: Partial<ReportDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'description',
        'source',
        'sourceId',
        'sourceInfo',
        'performerId',
        'performerInfo',
        'target',
        'targetId',
        'targetInfo',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}
