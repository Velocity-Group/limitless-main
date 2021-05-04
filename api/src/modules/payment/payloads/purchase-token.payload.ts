import {
  IsNotEmpty, IsOptional, IsString
} from 'class-validator';

export class PurchaseTokenPayload {
  @IsOptional()
  @IsString()
  couponCode: string

  @IsOptional()
  @IsString()
  currency: string

  @IsNotEmpty()
  @IsString()
  gateway: string
}
