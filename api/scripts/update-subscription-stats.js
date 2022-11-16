/* eslint-disable no-await-in-loop */
const {
  DB
} = require('../migrations/lib');

module.exports = async () => {
  const performers = await DB.collection('performers').find({}).toArray();
  const users = await DB.collection('users').find({}).toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const performer of performers) {
    const count = await DB.collection('usersubscriptions').countDocuments({ performerId: performer._id, status: 'active' });
    await DB.collection('performers').updateOne({ _id: performer._id },
      { $set: { 'stats.subscribers': count } });
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const user of users) {
    const count = await DB.collection('usersubscriptions').countDocuments({ userId: user._id, status: 'active' });
    await DB.collection('users').updateOne({ _id: user._id },
      { $set: { 'stats.totalSubscriptions': count } });
  }
};
