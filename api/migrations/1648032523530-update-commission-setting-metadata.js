const { DB, COLLECTION } = require('./lib');

module.exports.up = async function up(next) {
  // eslint-disable-next-line no-console
  console.log('Update commission setting metadata');
  await DB.collection(COLLECTION.SETTING).updateMany({ group: 'commission' }, { $set: { meta: { min: 0, max: 1, step: 0.01 } } });

  // eslint-disable-next-line no-console
  console.log('Update commission setting metadata success');

  next();
};

module.exports.down = function down(next) {
  next();
};
