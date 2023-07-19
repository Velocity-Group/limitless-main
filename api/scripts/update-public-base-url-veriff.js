const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  await DB.collection(COLLECTION.SETTING).updateOne({ key: 'veriffBaseUrl' },
    {
      $set: {
        public: true
      }
    });
};
