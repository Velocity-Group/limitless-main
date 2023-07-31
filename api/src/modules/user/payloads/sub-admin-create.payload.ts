/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsString, IsOptional, IsEmail, IsArray, IsIn, IsBoolean, Validate, IsNotEmpty
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  STATUSES, ROLE_USER, ROLE_SUB_ADMIN
} from '../constants';
import { Username } from '../validators/username.validator';

export class SubAdminAuthCreatePayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  @IsIn([ROLE_SUB_ADMIN], { each: true })
  roles: string[];

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  pathsAllow: string[];

  @ApiProperty()
  @IsString()
  @IsIn(STATUSES)
  status: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  verifiedEmail: boolean;

  constructor(params: Partial<SubAdminAuthCreatePayload>) {
    if (params) {
      this.firstName = params.firstName;
      this.lastName = params.lastName;
      this.username = params.username;
      this.name = params.name;
      this.email = params.email;
      this.roles = params.roles;
      this.password = params.password;
      this.status = params.status;
      this.pathsAllow = params.pathsAllow;
      this.verifiedEmail = params.verifiedEmail;
    }
  }
}
