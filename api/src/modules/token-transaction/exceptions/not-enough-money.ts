import { HttpException } from '@nestjs/common';

export class NotEnoughMoneyException extends HttpException {
  constructor() {
    super('You have an insufficient wallet balance. Please top up.', 422);
  }
}
