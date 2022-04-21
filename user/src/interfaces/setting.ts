export interface IError {
  statusCode: number;
  message: string;
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
  twitterClientId: string;
  tokenConversionRate: number;
  stripePublishableKey: string;
  stripeEnable: boolean;
  ccbillEnable: boolean;
  bitpayEnable: boolean;
  metaKeywords: string;
  metaDescription: string;
  agoraEnable: boolean;
}
