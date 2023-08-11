const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  PERFORMER_REFERRAL_COMMISSION: 'performerReferralCommission',
  USER_REFERRAL_COMMISSION: 'userReferralCommission'
};

const settings = [
  {
    key: SETTING_KEYS.PERFORMER_REFERRAL_COMMISSION,
    value: 0.05,
    name: 'Model/fan refer a model',
    description: '0.05 means the referral gets 5% on model revenue for 1 year',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  },
  {
    key: SETTING_KEYS.USER_REFERRAL_COMMISSION,
    value: 0.01,
    name: 'Model/fan refer a fan',
    description: '0.01 means the referral gets 1% on fan spends',
    public: true,
    group: 'commission',
    editable: true,
    type: 'number'
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update referral commission settings');

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
  console.log('Update referral commission settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
