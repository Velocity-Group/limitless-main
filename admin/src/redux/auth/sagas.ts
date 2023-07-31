/* eslint-disable consistent-return */
import { flatten } from 'lodash';
import { put } from 'redux-saga/effects';
import { createSagas } from '@lib/redux';
import Router from 'next/router';
import { authService, userService } from 'src/services';
import { ILogin } from 'src/interfaces';
import { resetUser } from '@redux/user/actions';
import { message } from 'antd';
import { ROLE_ADMIN, ROLE_SUB_ADMIN } from 'src/constants';
import { updateCurrentUser } from '../user/actions';
import {
  login, loginSuccess, logout, loginFail
} from './actions';

const authSagas = [
  {
    on: login,
    * worker(data: any) {
      try {
        const payload = data.payload as ILogin;
        const resp = (yield authService.login(payload)).data;
        // store token, update store and redirect to dashboard page
        yield authService.setToken(resp.token);
        const userResp = (yield userService.me()).data;
        if (userResp.roles.indexOf(ROLE_ADMIN) === -1 && userResp.roles.indexOf(ROLE_SUB_ADMIN) === -1) {
          message.error('You don\'t have permission to login to this page!');
          return yield logout();
        }
        yield put(updateCurrentUser(userResp));
        yield put(loginSuccess());
        Router.push('/');
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(loginFail(error));
      }
    }
  },
  {
    on: logout,
    * worker() {
      try {
        yield authService.removeToken();
        yield put(resetUser());
        Router.replace('/auth/login');
      } catch (e) {
        console.log(yield e);
      }
    }
  }
];

export default flatten(createSagas(authSagas));
