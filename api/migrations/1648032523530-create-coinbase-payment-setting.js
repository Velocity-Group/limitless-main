const {
  DB,
  COLLECTION
} = require('./lib');

const SETTING_KEYS = {
  COINBASE_API_KEY: 'coinbaseApiKey'
};

const settings = [{
  key: SETTING_KEYS.COINBASE_API_KEY,
  value: '',
  name: 'Coinbase Api Key',
  description: 'https://commerce.coinbase.com/settings/security',
  public: false,
  group: 'paymentGateways',
  editable: true,
  type: 'string'
}];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Create Coinbase payment gateway settings');
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
