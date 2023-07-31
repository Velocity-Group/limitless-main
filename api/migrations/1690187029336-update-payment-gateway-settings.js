const {
  DB,
  COLLECTION
} = require('./lib');

const SETTING_KEYS = {
  COINBASE_ENABLE: 'coinbaseEnable',
  STRIPE_ENABLE: 'stripeEnable',
  CCBILL_ENABLE: 'ccbillEnable',
  PAYMENT_GATEWAY: 'paymentGateway'
};

const settings = [{
  key: SETTING_KEYS.COINBASE_ENABLE,
  value: true,
  name: 'Enable Coinbase Payment',
  description: 'Turn on to enable Coinbase',
  public: true,
  group: 'paymentGateways',
  editable: true,
  type: 'boolean'
},
{
  key: SETTING_KEYS.STRIPE_ENABLE,
  value: true,
  name: 'Enable Stripe Payment',
  description: 'Turn on to enable Stripe',
  public: true,
  group: 'paymentGateways',
  editable: true,
  type: 'boolean'
},
{
  key: SETTING_KEYS.CCBILL_ENABLE,
  value: true,
  name: 'Enable CCBill Payment',
  description: 'Turn on to enable CCBill',
  public: true,
  group: 'paymentGateways',
  editable: true,
  type: 'boolean'
}];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update payment option settings');
  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: SETTING_KEYS.PAYMENT_GATEWAY
  });
  // eslint-disable-next-line no-restricted-syntax
  for (const setting of settings) {
    // eslint-disable-next-line no-await-in-loop
    const checkKey = await DB.collection(COLLECTION.SETTING).findOne({
      key: setting.key
    });
    if (!checkKey) {
      // eslint-disable-next-line no-await-in-loop
      await DB.collection(COLLECTION.SETTING).insertOne({
        ...setting,
        type: setting.type || 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // eslint-disable-next-line no-console
      console.log(`Inserted setting: ${setting.key}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Setting: ${setting.key} exists`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('Update payment options done');
  next();
};

module.exports.down = function down(next) {
  next();
};
