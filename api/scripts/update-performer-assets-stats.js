/* eslint-disable no-await-in-loop */
const {
  DB
} = require('../migrations/lib');

module.exports = async () => {
  const performers = await DB.collection('performers').find({}).toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const performer of performers) {
    const totalFeeds = await DB.collection('feeds').countDocuments({ fromSourceId: performer._id, status: 'active' });
    const totalVideos = await DB.collection('performervideos').countDocuments({ performerId: performer._id, status: 'active' });
    const totalGalleries = await DB.collection('performergalleries').countDocuments({ performerId: performer._id, status: 'active' });
    const totalPhotos = await DB.collection('performerphotos').countDocuments({ performerId: performer._id, status: 'active' });
    await DB.collection('performers').updateOne(
      { _id: performer._id },
      {
        $set: {
          stats: {
            totalVideos,
            totalPhotos,
            totalGalleries,
            totalFeeds
          }
        }
      }
    );
  }
};
