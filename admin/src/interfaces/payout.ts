export interface IPayoutRequest {
  _id: any;
  source?: string;
  sourceId?: string;
  sourceInfo?: any;
  paymentAccountType: string;
  paymentAccountInfo: any;
  requestNote?: string;
  adminNote?: string;
  status?: string;
  requestTokens?: number;
  tokenConversionRate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
