import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class ReferralStats {
  @ApiProperty()
  @IsString()
  @IsOptional()
  registerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  referralId: string;
}

export class ReferralSearch extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  referralId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fromDate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  toDate: string;
}

export class NewReferralPyaload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registerSource: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registerId: any;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
