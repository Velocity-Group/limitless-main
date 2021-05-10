import { merge } from 'lodash';
import { createReducers } from '@lib/redux';
import { IReduxAction, IUser } from 'src/interfaces';
import { logout } from '@redux/auth/actions';
import {
  updateCurrentUser,
  updateUserSuccess,
  setUpdating,
  updateCurrentUserAvatar,
  updateUserFail,
  updatePasswordSuccess,
  updatePasswordFail,
  setUpdatingBanking,
  updateBanking,
  updateBankingSuccess,
  updateBankingFail,
  updateCurrentUserCover,
  updateBlockCountries,
  updateBalance
} from './actions';

const initialState = {
  current: {
    _id: null,
    avatar: '/static/no-avatar.png',
    cover: null,
    name: '',
    email: ''
  },
  error: null,
  updateSuccess: false,
  updating: false
};

const userReducers = [
  {
    on: updateCurrentUser,
    reducer(state: any, data: any) {
      return {
        ...state,
        current: data.payload
      };
    }
  },
  {
    on: updateCurrentUserAvatar,
    reducer(state: any, data: any) {
      return {
        ...state,
        current: {
          ...state.current,
          avatar: data.payload
        }
      };
    }
  },
  {
    on: updateCurrentUserCover,
    reducer(state: any, data: any) {
      return {
        ...state,
        current: {
          ...state.current,
          cover: data.payload
        }
      };
    }
  },
  {
    on: updateUserSuccess,
    reducer(state: any, data: IReduxAction<IUser>) {
      return {
        ...state,
        current: data.payload,
        updateSuccess: true,
        error: null
      };
    }
  },
  {
    on: updateUserFail,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        updateUser: null,
        updateSuccess: false,
        error: data.payload
      };
    }
  },
  {
    on: setUpdating,
    reducer(state: any, data: IReduxAction<boolean>) {
      return {
        ...state,
        updating: data.payload
      };
    }
  },
  {
    on: updatePasswordSuccess,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        updateSuccess: true,
        updatedPassword: data.payload,
        error: null
      };
    }
  },
  {
    on: updatePasswordFail,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        updateSuccess: false,
        updatedPassword: null,
        error: data.payload
      };
    }
  },
  // Update banking
  // TODO add interface
  {
    on: setUpdatingBanking,
    reducer(state: any, data: IReduxAction<boolean>) {
      return {
        ...state,
        updating: data.payload,
        updateSuccess: false
      };
    }
  },
  {
    on: updateBanking,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        updateSuccess: false,
        updatedPassword: null,
        error: data.payload
      };
    }
  },
  {
    on: updateBankingSuccess,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        updateSuccess: true,
        updatedBanking: data.payload,
        current: { ...state.current, ...{ bankingInformation: data.payload } },
        error: null,
        updating: false
      };
    }
  },
  {
    on: updateBankingFail,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        updateSuccess: false,
        error: data.payload,
        updating: false
      };
    }
  },
  {
    on: updateBlockCountries,
    reducer(state: any, data: IReduxAction<any>) {
      return {
        ...state,
        current: { ...state.current, ...{ blockCountries: data.payload } }
      };
    }
  },
  {
    on: updateBalance,
    reducer(state: any, data: any) {
      const nextState = { ...state };
      const { token } = data.payload;
      nextState.current.balance += token;
      return {
        ...nextState
      };
    }
  },
  {
    on: logout,
    reducer() {
      return {
        ...initialState
      };
    }
  }
];

export default merge({}, createReducers('user', [userReducers], initialState));
