import { HttpException } from '@nestjs/common';

export class NotEnoughMoneyException extends HttpException {
  constructor() {
    super('Your balance of tokens is not enough', 400);
  }
}
