import {
  IsString, IsNotEmpty, IsNumber, Min, Max
} from 'class-validator';

export class CommissionSettingPayload {
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @IsNumber()
  @Min(0.01)
  @Max(0.99)
  @IsNotEmpty()
  commissionPercentage: number;
}
