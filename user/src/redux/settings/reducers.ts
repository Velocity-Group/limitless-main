import { merge } from 'lodash';
import { createReducers } from '@lib/redux';
import { updateSettings } from './actions';

// TODO -
const initialState = {
  requireEmailVerification: false,
  googleReCaptchaSiteKey: '',
  enableGoogleReCaptcha: false,
  googleClientId: '',
  tokenConversionRate: 1,
  stripePublishableKey: '',
  paymentGateway: 'stripe',
  veriffEnabled: true,
  veriffPublicKey: '',
  veriffBaseUrl: ''
};

const settingReducers = [
  {
    on: updateSettings,
    reducer(state: any, data: any) {
      return {
        ...state,
        ...data.payload
      };
    }
  }
];

export default merge({}, createReducers('settings', [settingReducers], initialState));
