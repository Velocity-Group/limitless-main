import { merge } from 'lodash';
import { createReducers } from '@lib/redux';
import { IReduxAction } from 'src/interfaces';
import { setSubscription } from './actions';

const initialState = {
  showModal: false,
  performer: {},
  subscriptionType: 'monthly'
};

const reducers = [
  {
    on: setSubscription,
    reducer(state: any, action: IReduxAction<any>) {
      return {
        ...state,
        ...action.payload
      };
    }
  }
];
export default merge({}, createReducers('subscription', [reducers], initialState));
