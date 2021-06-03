import {
  IsOptional, IsString
} from 'class-validator';

export class PurchaseTokenPayload {
  @IsOptional()
  @IsString()
  couponCode: string

  @IsOptional()
  @IsString()
  currency: string

  @IsString()
  @IsOptional()
  paymentGateway: string;

  @IsString()
  @IsOptional()
  stripeCardId: string;
}
