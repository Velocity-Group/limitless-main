const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  AGORA_APPID: 'agoraAppId',
  AGORA_CERTIFICATE: 'agoraCertificate',
  AGORA_ENABLE: 'agoraEnable'
};

const settings = [
  {
    key: SETTING_KEYS.AGORA_ENABLE,
    value: true,
    name: 'Enable/Disable Live Stream with Agora',
    description: '',
    public: true,
    group: 'agora',
    type: 'boolean',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AGORA_APPID,
    value: '',
    name: 'APPID',
    description:
      'After signing up at Console, multiple projects can be created. Each project will be assigned a unique App ID. Anyone with your App ID can use it on any Agora SDK. Hence, it is prudent to safeguard the App IDs.',
    public: true,
    group: 'agora',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AGORA_CERTIFICATE,
    value: '',
    name: 'App Certificate',
    description:
      'An App Certificate is a string generated from Agora Console, and it enables token authentication',
    public: false,
    group: 'agora',
    editable: true,
    visible: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate Agora settings');

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
  console.log('Migrate Agora done');
  next();
};

module.exports.down = function down(next) {
  next();
};
