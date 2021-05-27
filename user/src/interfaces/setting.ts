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
  requireEmailVerification: string;
  googleReCaptchaSiteKey: string;
  enableGoogleReCaptcha: string;
  googleClientId: string;
  tokenConversionRate: string;
  stripePublishableKey: string;
}
