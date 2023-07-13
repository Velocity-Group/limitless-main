const {
  DB,
  COLLECTION
} = require('./lib');

const SETTING_KEYS = {
  VERIFF_ENABLED: 'veriffEnabled',
  VERIFF_PUBLIC_KEY: 'veriffPublicKey',
  VERIFF_SECRET_KEY: 'veriffSecretKey',
  VERIFF_BASE_URL: 'veriffBaseUrl'
};

const settings = [{
  key: SETTING_KEYS.VERIFF_ENABLED,
  value: true,
  name: 'Veriff disabled/enabled',
  description: 'Turn on to enabled',
  public: true,
  group: 'veriff',
  editable: true,
  type: 'boolean'
},
{
  key: SETTING_KEYS.VERIFF_PUBLIC_KEY,
  value: '',
  name: 'Publishable API key',
  description: 'https://station.veriff.com/integrations/installation',
  public: true,
  group: 'veriff',
  editable: true,
  type: 'string'
},
{
  key: SETTING_KEYS.VERIFF_SECRET_KEY,
  value: '',
  name: 'Secret API Key',
  description: 'https://station.veriff.com/integrations/installation',
  public: false,
  group: 'veriff',
  editable: true,
  type: 'string'
},
{
  key: SETTING_KEYS.VERIFF_BASE_URL,
  value: '',
  name: 'Base Url',
  description: 'https://station.veriff.com/integrations/installation',
  public: false,
  group: 'veriff',
  editable: true,
  type: 'string'
}];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate Veriff settings');

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
  console.log('Migrate Veriff settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
