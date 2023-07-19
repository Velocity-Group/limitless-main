const { DB } = require('./lib');

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update payment records stripeInvoiceId to token');

  await DB.collection('paymenttransactions').updateMany({}, {
    $rename: { stripeInvoiceId: 'token' }
  });
  // eslint-disable-next-line no-restricted-syntax

  // eslint-disable-next-line no-console
  console.log('Update payment records stripeInvoiceId to token done');
  next();
};

module.exports.down = function down(next) {
  next();
};
