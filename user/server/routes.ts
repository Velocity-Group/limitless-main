// import Routes from 'next-routes';
const routes = require('next-routes');

/**
 * routes.add([name], pattern = /name, page = name)
   routes.add(object)
 */

export default routes()
  .add('dashboard', '/', '/')
  .add('contact', '/contact', '/contact')
  .add('video', '/video/:id', '/video')
  .add('store', '/store/:id', '/store')
  .add('gallery', '/gallery/:id', '/gallery')
  .add('page', '/page/:id', '/page')
  .add('feed', '/post/:id', '/post')
  .add('message', '/messages', '/messages')
  .add('cart', '/cart', '/cart')
  .add('error', '/error', '/error')
  .add('home', '/home', '/home')
  .add('search', '/search', '/search')
  .add('token-package', '/token-package', '/token-package')
  .add('payment-success', '/payment/success', '/payment/success')
  .add('payment-cancel', '/payment/cancel', '/payment/cancel')
  // performer
  .add('models', '/model', '/model')
  .add('banking', '/model/banking', '/model/banking')
  .add('block-countries', '/model/block-countries', '/model/block-countries')
  .add('block-user', '/model/block-user', '/model/block-user')
  .add('account', '/model/account', '/model/account')
  .add('earning', '/model/earning', '/model/earning')
  .add('feed-manager', '/model/my-post', '/model/my-post')
  .add('gallery-manager', '/model/my-gallery', '/model/my-gallery')
  .add('order-manager', '/model/my-order', '/model/my-order')
  .add('store-manager', '/model/my-store', '/model/my-store')
  .add('video-manager', '/model/my-video', '/model/my-video')
  .add('my-subscriber', '/model/my-subscriber', '/model/my-subscriber')
  .add('story-manager', '/model/my-story', '/model/my-story')
  .add('payout-request', '/model/payout-request', '/model/payout-request')
  .add('model-stream', '/model/live', '/model/live')
  .add('user-stream', '/streaming', '/streaming')
  .add('list-stream', '/streaming/:username', '/streaming/details')
  // must be in the last
  .add('model', '/:username', '/model/profile');
