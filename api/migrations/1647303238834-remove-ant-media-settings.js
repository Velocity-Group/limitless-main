const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Ant Media removal');
  await DB.collection(COLLECTION.SETTING).deleteMany({ group: 'ant' });

  // eslint-disable-next-line no-console
  console.log('Ant Media removal success');

  next();
};

module.exports.down = function down(next) {
  next();
};
