export interface ISetting {
  _id: string;
  key: string;
  value: any;
  name: string;
  description: string;
  group: string;
  public: boolean;
  type: string;
  visible: boolean;
  meta: {[key: string]: string};
  createdAt: Date;
  updatedAt: Date;
}

export interface IContact {
  email: string;
  message: any;
  name: string;
}

export interface ISettings {
  requireEmailVerification: boolean;
  googleReCaptchaSiteKey: string;
  enableGoogleReCaptcha: boolean;
  googleClientId: string;
  tokenConversionRate: number;
  stripePublishableKey: string;
  stripeEnable: boolean;
  ccbillEnable: boolean;
  bitpayEnable: boolean;
}
