import {
  IsString, IsOptional, IsNotEmpty, IsIn
} from 'class-validator';
import { SUBSCRIPTION_TYPE } from '../constants';

export class SubscriptionCreatePayload {
  @IsString()
  @IsOptional()
  @IsIn([
    SUBSCRIPTION_TYPE.MONTHLY,
    SUBSCRIPTION_TYPE.YEARLY,
    SUBSCRIPTION_TYPE.FREE
  ])
  subscriptionType = SUBSCRIPTION_TYPE.MONTHLY;

  @IsString()
  @IsNotEmpty()
  performerId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  expiredAt: string;

  @IsString()
  @IsOptional()
  status: string;
}

export class SubscriptionUpdatePayload {
  @IsString()
  @IsOptional()
  @IsIn([
    SUBSCRIPTION_TYPE.MONTHLY,
    SUBSCRIPTION_TYPE.YEARLY,
    SUBSCRIPTION_TYPE.FREE
  ])
  subscriptionType = SUBSCRIPTION_TYPE.MONTHLY;

  @IsString()
  @IsNotEmpty()
  expiredAt: string;

  @IsString()
  @IsOptional()
  status: string;
}
