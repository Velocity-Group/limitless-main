import { Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class StreamRequestDto {
  @Expose()
  _id: ObjectId;

  @Expose()
  performerId: ObjectId;

  @Expose()
  performerInfo: any;

  @Expose()
  userId: ObjectId;

  @Expose()
  userInfo: any;

  @Expose()
  startAt: string;

  @Expose()
  timezone: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  totalTimeInSeconds: number;

  @Expose()
  totalTokenSpent: number;
}
