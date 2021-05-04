import {
  IsString,
  IsOptional,
  Validate,
  IsEmail,
  IsNotEmpty,
  IsIn,
  MinLength,
  IsBoolean
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class PerformerRegisterPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiProperty()
  @IsString()
  @IsIn([PERFORMER_STATUSES.ACTIVE, PERFORMER_STATUSES.INACTIVE, PERFORMER_STATUSES.PENDING])
  @IsOptional()
  status = PERFORMER_STATUSES.ACTIVE;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneCode?: string; // international code prefix

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarId?: ObjectId;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verifiedEmail?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verifiedAccount?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  idVerificationId?: ObjectId;

  @ApiProperty()
  @IsString()
  @IsOptional()
  documentVerificationId?: ObjectId;

  @ApiProperty()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  dateOfBirth: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  invitationId: string | ObjectId;

  @ApiProperty()
  @IsOptional()
  @IsString()
  referralId: string | ObjectId;
}
