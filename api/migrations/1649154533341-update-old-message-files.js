const {
  DB
} = require('./lib');

module.exports.up = async function up(next) {
  const messages = await DB.collection('messages').find({ fileId: { $exists: true } }).toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const message of messages) {
    // eslint-disable-next-line no-await-in-loop

    // eslint-disable-next-line no-await-in-loop
    await DB.collection('messages').updateOne({
      _id: message._id
    }, {
      $set: {
        fileIds: [message.fileId]
      }
    }, {
      new: true
    });
    console.log(`Update file message ${message._id} done`);
  }
  next();
};

module.exports.down = function down(next) {
  next();
};
