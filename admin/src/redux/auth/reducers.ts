import { merge } from 'lodash';
import { createReducers } from '@lib/redux';
import login from 'pages/auth/login';
import { loginSuccess, loginFail, logout } from './actions';

const initialState = {
  loggedIn: false,
  authUser: null
};

const authReducers = [
  {
    on: login,
    reducer(state: any) {
      return {
        ...state,
        login: {
          requesting: false,
          error: null
        }
      };
    }
  },
  {
    on: loginSuccess,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: true,
        login: {
          requesting: false,
          error: null,
          data: data.payload,
          success: true
        }
      };
    }
  },
  {
    on: loginFail,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: false,
        login: {
          requesting: false,
          error: data.payload,
          success: false
        }
      };
    }
  },
  {
    on: logout,
    reducer() {
      return {
        loggedIn: false,
        authUser: null
      };
    }
  }
];

export default merge({}, createReducers('auth', [authReducers], initialState));
