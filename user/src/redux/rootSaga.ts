import { all, spawn } from 'redux-saga/effects';

import userSagas from './user/sagas';
import authSagas from './auth/sagas';
import performerSagas from './performer/sagas';
import videoSagas from './video/sagas';
import productSagas from './product/sagas';
import commentSagas from './comment/sagas';
import gallerySagas from './gallery/sagas';
import bannerSagas from './banner/sagas';
import messageSagas from './message/sagas';
import systemSagas from './system/sagas';
import feedSagas from './feed/sagas';
import streamChatSagas from './stream-chat/sagas';

function* rootSaga() {
  yield all(
    [
      ...authSagas,
      ...userSagas,
      ...performerSagas,
      ...videoSagas,
      ...productSagas,
      ...commentSagas,
      ...gallerySagas,
      ...bannerSagas,
      ...messageSagas,
      ...systemSagas,
      ...feedSagas,
      ...streamChatSagas
    ].map(spawn)
  );
}

export default rootSaga;
