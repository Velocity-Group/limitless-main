import {
  IsOptional, IsString, IsNumber
} from 'class-validator';

export class PurchaseProductsPayload {
  @IsString()
  @IsOptional()
  deliveryAddressId: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  userNote: string;

  @IsNumber()
  @IsOptional()
  quantity: number;
}
