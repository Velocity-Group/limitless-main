import {
  IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max
} from 'class-validator';

export class CommissionSettingPayload {
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @IsNumber()
  @Min(0)
  @Max(0.99)
  @IsOptional()
  commissionPercentage: number;
}
