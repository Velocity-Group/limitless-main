import { IsNotEmpty, IsIn } from 'class-validator';

export class SubscribePerformerPayload {
  @IsNotEmpty()
  performerId: string;

  @IsNotEmpty()
  @IsIn(['monthly', 'yearly', 'free'])
  type: string;
}
