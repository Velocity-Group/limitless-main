import { IsOptional, IsString, IsNumber } from 'class-validator';

export class PurchaseProductsPayload {
  @IsString()
  @IsOptional()
  deliveryAddress: string;

  @IsString()
  @IsOptional()
  postalCode: string;

  @IsString()
  @IsOptional()
  userNote: string;

  @IsNumber()
  @IsOptional()
  quantity: number;
}
