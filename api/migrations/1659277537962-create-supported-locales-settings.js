/* eslint-disable no-console */
/* eslint-disable func-names */
const { DB, COLLECTION } = require('./lib');

const SUPPORTED_LOCALES = 'supportedLocales';
const setting = {
  key: SUPPORTED_LOCALES,
  value: ['en-US', 'fr'],
  name: 'Supported Locales',
  description: 'List of locale will be shown in bottom footer menu',
  public: true,
  group: 'language',
  editable: true,
  visible: true,
  type: 'locale',
  meta: {
    mode: 'multiple'
  }
};

module.exports.up = async function (next) {
  console.log('Create support locales setting');
  const checkkey = await DB.collection(COLLECTION.SETTING).findOne({
    key: setting.key
  });
  if (!checkkey) {
    await DB.collection(COLLECTION.SETTING).insertOne({
      ...setting,
      type: setting.type || 'text',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Setting: ${setting.key} exists`);
  }
  console.log('Create support locales setting done!');

  next();
};

module.exports.down = function down(next) {
  next();
};
