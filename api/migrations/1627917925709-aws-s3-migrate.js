const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  AWS_S3_ENABLE: 's3Enabled',
  AWS_S3_REGION_NAME: 's3RegionName',
  AWS_S3_ACCESS_KEY_ID: 's3AccessKeyId',
  AWS_S3_SECRET_ACCESS_KEY: 's3SecretAccessKey',
  AWS_S3_BUCKET_ENDPOINT: 's3BucketEnpoint',
  AWS_S3_BUCKET_NAME: 's3BucketName'
};

const settings = [
  {
    key: SETTING_KEYS.AWS_S3_ENABLE,
    value: false,
    name: 'Enable/Disable S3 service',
    description: '',
    public: false,
    group: 's3',
    type: 'boolean',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AWS_S3_REGION_NAME,
    value: '',
    name: 'Region Name',
    description: 'Bucket region eg: us-east-1, us-west2, ...',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AWS_S3_BUCKET_NAME,
    value: '',
    name: 'Bucket name',
    description: 'Name of s3 bucket',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AWS_S3_ACCESS_KEY_ID,
    value: '',
    name: 'Access Key ID',
    description: 'IAM user access key ID eg AKIAXYAKOFUZMOHZEGYB  (https://console.aws.amazon.com/iam -> Users -> Security credentials)',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AWS_S3_SECRET_ACCESS_KEY,
    value: '',
    name: 'Secret Access Key',
    description: 'IAM user secret key eg xxxxxxxxxxxxxxunmgh8npIRk1hg7PP6eSJsSsri',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.AWS_S3_BUCKET_ENDPOINT,
    value: '',
    name: 'Endpoint',
    description: 's3.region.amazonaws.com  eg: s3.us-east-1.amazonaws.com',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate AWS S3 settings');

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
  console.log('Migrate AWS S3 settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
