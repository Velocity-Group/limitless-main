import { flatten } from 'lodash';
import { put } from 'redux-saga/effects';
import { createSagas } from '@lib/redux';
import { feedService } from '@services/index';
import { IReduxAction } from 'src/interfaces';
import {
  getFeeds, getFeedsSuccess, getFeedsFail,
  moreFeeds, moreFeedsSuccess, moreFeedsFail,
  getVideoFeeds, getVideoFeedsFail, getVideoFeedsSuccess,
  getPhotoFeeds, getPhotoFeedsFail, getPhotoFeedsSuccess, moreVideoFeeds, morePhotoFeeds, morePhotoFeedsSuccess, morePhotoFeedsFail
} from './actions';

const performerSagas = [
  {
    on: getFeeds,
    * worker(data: IReduxAction<any>) {
      try {
        const resp = data.payload.isHome ? yield feedService.userHomeFeeds(data.payload) : yield feedService.searchPerformerFeeds(data.payload.performerId, data.payload);
        yield put(getFeedsSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(getFeedsFail(error));
      }
    }
  },
  {
    on: moreFeeds,
    * worker(data: IReduxAction<any>) {
      try {
        const resp = data.payload.isHome ? yield feedService.userHomeFeeds(data.payload) : yield feedService.searchPerformerFeeds(data.payload.performerId, data.payload);
        yield put(moreFeedsSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(moreFeedsFail(error));
      }
    }
  },
  {
    on: getVideoFeeds,
    * worker(data: IReduxAction<any>) {
      try {
        const resp = yield feedService.userSearch({ ...data.payload, postType: 'video' });
        yield put(getVideoFeedsSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(getVideoFeedsFail(error));
      }
    }
  },
  {
    on: moreVideoFeeds,
    * worker(data: IReduxAction<any>) {
      try {
        const resp = yield feedService.userSearch({ ...data.payload, postType: 'video' });
        yield put(moreFeedsSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(moreFeedsFail(error));
      }
    }
  },

  {
    on: getPhotoFeeds,
    * worker(data: IReduxAction<any>) {
      try {
        const resp = yield feedService.userSearch({ ...data.payload, postType: 'photo' });
        yield put(getPhotoFeedsSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(getPhotoFeedsFail(error));
      }
    }
  },
  {
    on: morePhotoFeeds,
    * worker(data: IReduxAction<any>) {
      try {
        const resp = yield feedService.userSearch({ ...data.payload, postType: 'photo' });
        yield put(morePhotoFeedsSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(morePhotoFeedsFail(error));
      }
    }
  }
];

export default flatten([createSagas(performerSagas)]);
