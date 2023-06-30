/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { readdirSync, existsSync } = require('fs');
const { readFileSync } = require('fs');
const { join, parse } = require('path');
const { DB, COLLECTION } = require('./lib');

const defaultDir = join(__dirname, '..', 'src', 'templates', 'emails');

const TEMPLATE_DIR = existsSync(defaultDir)
  ? defaultDir
  : join(__dirname, '..', 'dist', 'templates', 'emails');

const templateMap = {
  'live-streaming-request-approved': {
    name: '1-1 Live streaming appointment ',
    subject: '1-1 Live streaming appointment ',
    desc: 'If the model approves the request, email 1-1 live streaming meet ,schedule 1-1Live streaming appointment '
  },
  'model-approve-live-streaming-request': {
    name: 'Approval Email',
    subject: 'Your request has been approved',
    desc: 'If model is okay with that day and time and approve the request  , the notification will be sent on his email.'
  },
  'model-reject-live-streaming-request': {
    name: 'Reject Email',
    subject: 'Your request has been rejected',
    desc: 'If the model rejects the user, Email template'
  }
};

module.exports.up = async function up(next) {
  const files = readdirSync(TEMPLATE_DIR).filter((f) => f.includes('.html'));
  for (const file of files) {
    const content = readFileSync(join(TEMPLATE_DIR, file)).toString();
    const key = parse(file).name;
    const exist = await DB.collection(COLLECTION.EMAIL_TEMPLATE).findOne({ key });
    if (!exist) {
      templateMap[key] && await DB.collection(COLLECTION.EMAIL_TEMPLATE).insertOne({
        key,
        content,
        subject: templateMap[key] ? templateMap[key].subject : null,
        name: templateMap[key] ? templateMap[key].name : key,
        description: templateMap[key] ? templateMap[key].desc : 'N/A',
        layout: 'layouts/default',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  next();
};

module.exports.down = function down(next) {
  next();
};
