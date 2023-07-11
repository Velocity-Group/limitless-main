import { merge } from 'lodash';
import { createReducers } from '@lib/redux';
import { updateUIValue, loadUIValue } from './actions';

const initialState = {
  theme: 'light',
  siteName: '',
  logo: '',
  menus: [],
  favicon: '/static/favicon.ico',
  loginPlaceholderImage: '',
  footerContent: '',
  modelBenefit: '',
  userBenefit: ''
};

const uiReducers = [
  {
    on: updateUIValue,
    reducer(state: any, data: any) {
      if (process.browser) {
        // Don't save menus data to localstorage
        Object.keys(data.payload).forEach(
          (key) => key !== 'menus' && localStorage && localStorage.setItem(key, data.payload[key])
        );
      }
      return {
        ...state,
        ...data.payload
      };
    }
  },
  {
    on: loadUIValue,
    reducer(state: any) {
      const newVal = {};
      if (process.browser) {
        // Don't get menus data from localstorage
        Object.keys(initialState).forEach((key) => {
          const val = key !== 'menus' && localStorage.getItem(key);
          if (val) {
            newVal[key] = val;
          }
        });
      }
      return {
        ...state,
        ...newVal
      };
    }
  }
];

export default merge({}, createReducers('ui', [uiReducers], initialState));
