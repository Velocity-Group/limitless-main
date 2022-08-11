import {
  IsNumber,
  IsOptional, IsString
} from 'class-validator';

export class PurchaseTokenPayload {
  @IsNumber()
  @IsOptional()
  amount: number;

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
