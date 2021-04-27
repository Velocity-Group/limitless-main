import { merge } from 'lodash';
import { createReducers } from '@lib/redux';
import { setErrorSystem } from './actions';

// TODO -
const initialState = {
  error: null
};

const systemReducers = [
  {
    on: setErrorSystem,
    reducer(state: any, data: any) {
      return {
        ...state,
        error: data.payload
      };
    }
  }
];

export default merge(
  {},
  createReducers('system', [systemReducers], initialState)
);
