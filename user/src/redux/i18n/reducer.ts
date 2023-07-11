import { createReducers } from '@lib/redux';
import { merge } from 'lodash';
import { ILanguageModel } from 'src/interfaces/language';
import { IReduxAction } from 'src/interfaces';
import { updateI18next } from './action';

const initialState = {
  messages: {},
  keys: []
};

const reducer = [
  {
    on: updateI18next,
    reducer(state: any, action: IReduxAction<ILanguageModel[]>) {
      const keys = (action.payload || []).map((d) => d.key);
      const messages = {};
      (action.payload || []).forEach((d) => {
        messages[d.key] = d.value;
      });
      return {
        ...state,
        keys,
        messages
      };
    }
  }
];

export default merge({}, createReducers('i18n', [reducer], initialState));
