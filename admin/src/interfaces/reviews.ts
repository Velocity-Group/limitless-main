export interface IReview {
  _id: string;

  objectType: string;

  objectId: string;

  performerId: string;

  performerInfo?: any;

  objectInfo?: any;

  comment: string;

  rating: number;

  createdBy: string;

  creator?: any;

  createdAt: Date;

  updatedAt: Date;
}
export interface ICreateReview {
  objectId: string;
  comment: string;
  objectType: string;
  rating: number;
}
