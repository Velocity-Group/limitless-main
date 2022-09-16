import { HttpException } from '@nestjs/common';

export class DuplicateRequestException extends HttpException {
  constructor() {
    super('Please wait for the current request get paid first!', 422);
  }
}
