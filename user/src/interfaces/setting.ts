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
  metaKeywords: string;
  metaDescription: string;
  agoraEnable: boolean;
  paymentGateway: string;
  veriffEnabled: boolean;
  veriffPublicKey: string;
  veriffBaseUrl: string;
  coinbaseEnable: string;
  stripeEnable: string;
  ccbillEnable: string;
  performerReferralCommission: number;
  userReferralCommission: number;
}
