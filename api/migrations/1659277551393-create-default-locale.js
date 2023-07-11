const {
  DB,
  COLLECTION
} = require('./lib');

const DEFAULT_LOCALE = 'defaultLocale';
const setting = {
  key: DEFAULT_LOCALE,
  value: 'en-US',
  name: 'Default Locale',
  description: 'Default locale',
  public: true,
  group: 'language',
  editable: true,
  visible: true,
  type: 'locale',
  meta: {
    showSearch: true
  }
};

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Create default locale');

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
  // eslint-disable-next-line no-console
  console.log('Create default locale done!');
  next();
};

module.exports.down = function downn(next) {
  next();
};
