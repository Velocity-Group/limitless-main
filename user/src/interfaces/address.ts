export interface IAddress {
  _id: string;

  source: string;

  sourceId: string;

  name: string;

  country: string;

  state: string;

  city: string;

  district: string;

  ward: string;

  streetNumber: string;

  streetAddress: string;

  zipCode: string;

  description: string;

  createdAt: Date;

  updatedAt: Date;
}
