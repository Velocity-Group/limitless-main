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
  .add('wallet', '/wallet', '/wallet')
  .add('payment-success', '/payment/success', '/payment/success')
  .add('payment-cancel', '/payment/cancel', '/payment/cancel')
  // performer
  .add('models', '/model', '/model')
  .add('user-stream', '/streaming', '/streaming')
  .add('list-stream', '/streaming/:username', '/streaming/details')
  // must be in the last
  .add('model', '/:username', '/model/profile');
