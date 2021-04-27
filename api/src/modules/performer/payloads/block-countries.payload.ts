import {
  IsOptional, IsArray
} from 'class-validator';

export class BlockCountriesSettingPayload {
  @IsArray()
  @IsOptional()
  countries: string[];
}
