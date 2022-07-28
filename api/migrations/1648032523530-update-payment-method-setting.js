const {
  DB,
  COLLECTION
} = require('./lib');

const SETTING_KEYS = {
  BITPAY_PRODUCTION_MODE: 'bitpayProductionMode',
  BITPAY_API_TOKEN: 'bitpayApiToken',
  BITPAY_ENABLE: 'bitpayEnable',
  STRIPE_ENABLE: 'stripeEnable',
  CCBILL_ENABLE: 'ccbillEnable',
  TOKEN_CONVERSION_RATE: 'tokenConversionRate',

  PAYMENT_GATEWAY: 'paymentGateway',

  CCBILL_CLIENT_ACCOUNT_NUMBER: 'ccbillClientAccountNumber',
  CCBILL_SUB_ACCOUNT_NUMBER: 'ccbillSubAccountNumber',
  CCBILL_SINGLE_SUB_ACCOUNT_NUMBER: 'ccbillSingleSubAccountNumber',
  CCBILL_RECURRING_SUB_ACCOUNT_NUMBER: 'ccbillRecurringSubAccountNumber',
  CCBILL_FLEXFORM_ID: 'ccbillFlexformId',
  CCBILL_SALT: 'ccbillSalt',
  CCBILL_DATALINK_USERNAME: 'ccbillDatalinkUsername',
  CCBILL_DATALINK_PASSWORD: 'ccbillDatalinkPassword',

  STRIPE_PUBLISHABLE_KEY: 'stripePublishableKey',
  STRIPE_SECRET_KEY: 'stripeSecretKey'
};

const settings = [{
  key: SETTING_KEYS.PAYMENT_GATEWAY,
  value: 'stripe',
  name: 'Payment Gateway',
  description: 'Platform payment gateway',
  public: true,
  group: 'paymentGateways',
  editable: true,
  type: 'string'
},
{
  key: SETTING_KEYS.CCBILL_SINGLE_SUB_ACCOUNT_NUMBER,
  value: '',
  name: 'Single Purchase Sub Account Number',
  description: 'ex: 0000',
  public: false,
  group: 'paymentGateways',
  editable: true,
  type: 'string'
},
{
  key: SETTING_KEYS.CCBILL_RECURRING_SUB_ACCOUNT_NUMBER,
  value: '',
  name: 'Reccurring Purchase Sub Account Number',
  description: 'ex: 0001',
  public: false,
  group: 'paymentGateways',
  editable: true,
  type: 'string'
}];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update payment gateway settings');

  await DB.collection(COLLECTION.SETTING).deleteMany({
    key: {
      $in: [
        'bitpayProductionMode', 'bitpayApiToken', 'bitpayEnable', 'stripeEnable',
        'ccbillEnable', 'tokenConversionRate'
      ]
    }
  });
  await DB.collection(COLLECTION.SETTING).updateMany({
    key: {
      $in: [
        'ccbillClientAccountNumber', 'ccbillSubAccountNumber', 'ccbillFlexformId', 'ccbillSalt',
        'ccbillDatalinkUsername', 'ccbillDatalinkPassword', 'stripePublishableKey', 'stripeSecretKey'
      ]
    }
  }, {
    $set: {
      group: 'paymentGateways'
    }
  });
  await DB.collection(COLLECTION.SETTING).deleteMany({
    key: {
      $in: [
        'ccbillSubAccountNumber'
      ]
    }
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
  console.log('Update payment gateway settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
