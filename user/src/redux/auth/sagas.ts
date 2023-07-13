import { flatten } from 'lodash';
import { put } from 'redux-saga/effects';
import { createSagas } from '@lib/redux';
import Router from 'next/router';
import { authService, userService } from 'src/services';
import {
  ILogin, IFanRegister, IForgot
} from 'src/interfaces';
import { message } from 'antd';
import { updateCurrentUser } from '../user/actions';
import {
  loginSocial,
  login,
  loginSuccess,
  logout,
  loginFail,
  registerFanFail,
  registerFan,
  registerFanSuccess,
  registerPerformerFail,
  registerPerformer,
  registerPerformerSuccess,
  forgot,
  forgotSuccess,
  forgotFail,
  getCurrentUser
} from './actions';

const authSagas = [
  {
    on: login,
    * worker(data: any) {
      try {
        const payload = data.payload as ILogin;
        const resp = (yield authService.login(payload)).data;
        // store token, update store and redirect to dashboard page
        yield authService.setToken(resp.token, payload?.remember);
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
        yield put(loginSuccess());
        if (!userResp?.data?.isPerformer) {
          Router.push((!userResp.data.email || !userResp.data.username) ? '/user/account' : '/home');
        }
        if (userResp?.data?.isPerformer) {
          (!userResp.data.email || !userResp.data.username) ? Router.push('/model/account') : Router.push({ pathname: '/model/profile', query: { username: userResp.data.username || userResp.data._id } }, `/${userResp.data.username || userResp.data._id}`);
        }
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(error?.message || 'Incorrect credentials!');
        yield put(loginFail(error));
      }
    }
  },
  {
    on: loginSocial,
    * worker(data: any) {
      try {
        const payload = data.payload as any;
        const { token } = payload;
        yield authService.setToken(token);
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
        yield put(loginSuccess());
        if (!userResp?.data?.isPerformer) {
          Router.push((!userResp.data.email || !userResp.data.username) ? '/user/account' : '/home');
        }
        if (userResp?.data?.isPerformer) {
          (!userResp.data.email || !userResp.data.username) ? Router.push('/model/account') : Router.push({ pathname: '/model/profile', query: { username: userResp.data.username || userResp.data._id } }, `/${userResp.data.username || userResp.data._id}`);
        }
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(error?.message || 'Incorrect credentials!');
        yield put(loginFail(error));
      }
    }
  },
  {
    on: registerFan,
    * worker(data: any) {
      try {
        const payload = data.payload as IFanRegister;
        const resp = (yield authService.register(payload)).data;
        message.success(resp?.message || 'Sign up success!', 10);
        Router.push('/auth/login');
        yield put(registerFanSuccess(resp));
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(error?.message || 'This Username or email address has been already taken.', 5);
        yield put(registerFanFail(error));
      }
    }
  },
  {
    on: registerPerformer,
    * worker(data: any) {
      try {
        const resp = (yield authService.registerPerformer(data.payload)).data;
        yield put(registerPerformerSuccess(resp));
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(error.message || 'An error occured, please try again later');
        yield put(registerPerformerFail(error));
      }
    }
  },
  {
    on: logout,
    * worker() {
      yield authService.removeToken();
      Router.replace('/');
    }
  },
  {
    on: forgot,
    * worker(data: any) {
      try {
        const payload = data.payload as IForgot;
        const resp = (yield authService.resetPassword(payload)).data;
        message.success(
          'We\'ve sent an email to reset your password, please check your inbox.',
          10
        );
        yield put(forgotSuccess(resp));
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error((error && error.message) || 'Something went wrong. Please try again later', 5);
        yield put(forgotFail(error));
      }
    }
  },
  {
    on: getCurrentUser,
    * worker() {
      try {
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        // eslint-disable-next-line no-console
        console.log(error);
      }
    }
  }
];

export default flatten([createSagas(authSagas)]);
