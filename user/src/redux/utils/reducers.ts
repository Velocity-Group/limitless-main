import { createReducers } from '@lib/redux';
import { merge } from 'lodash';
import { updateUtils } from './actions';

const initialState = {
  countries: []
};

const utilsReducers = [
  {
    on: updateUtils,
    reducer(state : any, data: any) {
      return (
        {
          ...data.payload
        }
      );
    }
  }
];

export default merge({}, createReducers('utils', [utilsReducers], initialState));
