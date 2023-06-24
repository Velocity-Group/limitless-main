const { DB, COLLECTION } = require('./lib');

const SETTING_KEYS = {
  S3_SERVICE_PROVIDER: 's3ServiceProvider',
  GCS_PROJECT_ID: 'gcsProjectId',
  GCS_BUCKET_NAME: 'gcsBucketName',
  GCS_PRIVATE_KEY_ID: 'gcsPrivateKeyId',
  GCS_PRIVATE_KEY_SECRET: 'gcsPrivateKeySecret',
  GCS_CLIENT_EMAIL: 'gcsClientEmail',
  GCS_CLIENT_ID: 'gcsClientId',
  GCS_CLIENT_CERT_URL: 'gcsClientCertUrl'
};

const settings = [
  {
    key: SETTING_KEYS.S3_SERVICE_PROVIDER,
    value: 'gcs',
    name: 'S3 service provider',
    description: 'aws, gcs, azure,...',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_PROJECT_ID,
    value: '',
    name: 'Project id',
    description: 'GCS project ID',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_BUCKET_NAME,
    value: '',
    name: 'Bucket name',
    description: 'GCS bucket name',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_PRIVATE_KEY_ID,
    value: '',
    name: 'Private key id',
    description: 'GCS private key id',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_PRIVATE_KEY_SECRET,
    value: '',
    name: 'Private key secret',
    description: 'GCS private key secret',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_CLIENT_EMAIL,
    value: '',
    name: 'Client email',
    description: 'IAM service account email',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_CLIENT_ID,
    value: '',
    name: 'Client id',
    description: 'IAM service account client Id',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  },
  {
    key: SETTING_KEYS.GCS_CLIENT_CERT_URL,
    value: '',
    name: 'Client x509 cert url',
    description: 'IAM service account client cert url',
    public: false,
    group: 's3',
    editable: true,
    visible: true
  }
];

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Migrate GCS S3 settings');
  await DB.collection(COLLECTION.SETTING).deleteOne({
    key: 's3Enabled'
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
  console.log('Migrate GCS S3 settings done');
  next();
};

module.exports.down = function down(next) {
  next();
};
