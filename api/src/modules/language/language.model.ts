import { Document } from 'mongoose';

export class LanguageModel extends Document {
  key: string;

  locale: string;

  value: string;

  createdAt: Date;

  updatedAt: Date;
}
