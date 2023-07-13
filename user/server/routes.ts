// import Routes from 'next-routes';
const routes = require('next-routes');

/**
 * routes.add([name], pattern = /name, page = name)
   routes.add(object)
 */

export default routes()
  .add('dashboard', '/', '/')
  .add('register', '/auth/register', '/auth/register')
  .add('login', '/auth/login', '/auth/login')
  .add('email-verified-success', '/auth/email-verified-success', '/auth/email-verified-success')
  .add('contact', '/contact', '/contact')
  .add('video', '/video/:id', '/video')
  .add('store', '/store/:id', '/store')
  .add('gallery', '/gallery/:id', '/gallery')
  .add('page', '/page/:id', '/page')
  .add('feed', '/post/:id', '/post')
  .add('schedule-live-streaming', '/schedule/live-streaming', '/schedule/live-streaming')
  .add('schedule-live-streaming-request', '/schedule/live-streaming/request', '/schedule/live-streaming/request')
  .add('message', '/messages', '/messages')
  .add('cart', '/cart', '/cart')
  .add('error', '/error', '/error')
  .add('home', '/home', '/home')
  .add('search', '/search', '/search')
  .add('wallet', '/wallet', '/wallet')
  .add('payment-success', '/payment/success', '/payment/success')
  .add('payment-cancel', '/payment/cancel', '/payment/cancel')
  .add('verification', '/id-verification', '/id-verification')
  // performer
  .add('models', '/model', '/model')
  .add('model-register', '/auth/model-register', '/auth/model-register')
  .add('user-stream', '/streaming', '/streaming')
  .add('list-stream', '/streaming/:username', '/streaming/details')
  .add('model-live', '/model/live', '/model/live')
  .add('model-account', '/model/account', '/model/account')
  .add('model-block-user', '/model/block-user', '/model/block-user')
  .add('model-block-countries', '/model/block-countries', '/model/block-countries')
  .add('model-mass-messages', '/model/mass-messages', '/model/mass-messages')
  .add('model-banking', '/model/banking', '/model/banking')
  .add('model-post', '/model/my-post', '/model/my-post')
  .add('model-video', '/model/my-video', '/model/my-video')
  .add('model-store', '/model/my-store', '/model/my-store')
  .add('model-gallery', '/model/my-gallery', '/model/my-gallery')
  .add('model-order', '/model/my-order', '/model/my-order')
  .add('model-earning', '/model/earning', '/model/earning')
  .add('model-payout-request', '/model/payout-request', '/model/payout-request')
  // user
  .add('user-account', '/user/account', '/user/account')
  .add('fan-register', '/auth/fan-register', '/auth/fan-register')
  .add('user-cards', '/user/cards', '/user/cards')
  .add('user-bookmarks', '/user/bookmarks', '/user/bookmarks')
  .add('user-my-subscription', '/user/my-subscription', '/user/my-subscription')
  .add('user-orders', '/user/orders', '/user/orders')
  .add('user-payment-history', '/user/payment-history', '/user/payment-history')
  .add('user-token-transaction', '/user/token-transaction', '/user/token-transaction')

  // must be in the last
  .add('model', '/:username', '/model/profile')

  // route with locale translation
  .add('i18n-dashboard', '/:locale', '/')
  .add('i18n-register', '/:locale/auth/register', '/auth/register')
  .add('i18n-login', '/:locale/auth/login', '/auth/login')
  .add('i18n-email-verified-success', '/:locale/auth/email-verified-success', '/auth/email-verified-success')
  .add('i18n-contact', '/:locale/contact', '/contact')
  .add('i18n-video', '/:locale/video/:id', '/video')
  .add('i18n-store', '/:locale/store/:id', '/store')
  .add('i18n-gallery', '/:locale/gallery/:id', '/gallery')
  .add('i18n-page', '/:locale/page/:id', '/page')
  .add('i18n-feed', '/:locale/post/:id', '/post')
  .add('i18n-schedule-live-streaming', '/:locale/schedule/live-streaming', '/schedule/live-streaming')
  .add('i18n-schedule-live-streaming-request', '/:locale/schedule/live-streaming/request', '/schedule/live-streaming/request')
  .add('i18n-message', '/:locale/messages', '/messages')
  .add('i18n-cart', '/:locale/cart', '/cart')
  .add('i18n-error', '/:locale/error', '/error')
  .add('i18n-home', '/:locale/home', '/home')
  .add('i18n-search', '/:locale/search', '/search')
  .add('i18n-wallet', '/:locale/wallet', '/wallet')
  .add('i18n-token-package', '/:locale/token-package', '/token-package')
  .add('i18n-payment-success', '/:locale/payment/success', '/payment/success')
  .add('i18n-payment-cancel', '/:locale/payment/cancel', '/payment/cancel')
  .add('i18n-verification', '/:locale/id-verification', '/id-verification')

  // locale of performer
  .add('i18n-models', '/:locale/model', '/model')
  .add('i18n-model-register', '/:locale/auth/model-register', '/auth/model-register')
  .add('i18n-user-stream', '/:locale/streaming', '/streaming')
  .add('i18n-list-stream', '/:locale/streaming/:username', '/streaming/details')
  .add('i18n-model-live', '/:locale/model/live', '/model/live')
  .add('i18n-model-account', '/:locale/model/account', '/model/account')
  .add('i18n-model-block-user', '/:locale/model/block-user', '/model/block-user')
  .add('i18n-model-block-countries', '/:locale/model/block-countries', '/model/block-countries')
  .add('i18n-model-mass-messages', '/:locale/model/mass-messages', '/model/mass-messages')
  .add('i18n-model-banking', '/:locale/model/banking', '/model/banking')
  .add('i18n-model-post', '/:locale/model/my-post', '/model/my-post')
  .add('i18n-model-video', '/:locale/model/my-video', '/model/my-video')
  .add('i18n-model-store', '/:locale/model/my-store', '/model/my-store')
  .add('i18n-model-gallery', '/:locale/model/my-gallery', '/model/my-gallery')
  .add('i18n-model-order', '/:locale/model/my-order', '/model/my-order')
  .add('i18n-model-earning', '/:locale/model/earning', '/model/earning')
  .add('i18n-model-payout-request', '/:locale/model/payout-request', '/model/payout-request')

  // locale of user
  .add('i18n-user-account', '/:locale/user/account', '/user/account')
  .add('i18n-fan-register', '/:locale/auth/fan-register', '/auth/fan-register')
  .add('i18n-user-cards', '/:locale/user/cards', '/user/cards')
  .add('i18n-user-bookmarks', '/:locale/user/bookmarks', '/user/bookmarks')
  .add('i18n-user-my-subscription', '/:locale/user/my-subscription', '/user/my-subscription')
  .add('i18n-user-orders', '/:locale/user/orders', '/user/orders')
  .add('i18n-user-payment-history', '/:locale/user/payment-history', '/user/payment-history')
  .add('i18n-user-token-transaction', '/:locale/user/token-transaction', '/user/token-transaction')

  .add('i18n-model', '/:locale/:username', '/model/profile');
