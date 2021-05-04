import { HttpStatus } from '@nestjs/common';
import { RuntimeException } from 'src/kernel';

export class ConvertMp3ErrorException extends RuntimeException {
  constructor(
    error = 'convert mp3 error!'
  ) {
    super('Convert mp3 error', error, HttpStatus.BAD_REQUEST);
  }
}
