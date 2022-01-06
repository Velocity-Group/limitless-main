import { HttpException } from '@nestjs/common';

export class InvalidRequestTokenException extends HttpException {
  constructor() {
    super('Requested tokens is greater than your balance, please check again', 422);
  }
}
