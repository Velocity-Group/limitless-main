import {
  IsNotEmpty, IsString
} from 'class-validator';

export class AuthoriseCardPayload {
  @IsString()
  @IsNotEmpty()
  sourceToken: string;
}
