import {
  IsNotEmpty, IsOptional, IsString, IsNumber
} from 'class-validator';

export class PurchaseProductsPayload {
  @IsString()
  @IsNotEmpty()
  deliveryAddressId: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  userNote: string;

  @IsNumber()
  @IsOptional()
  quantity: number;
}
