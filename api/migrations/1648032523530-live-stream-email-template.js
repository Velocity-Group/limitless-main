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
  'performer-live-notify-followers': {
    name: 'Notify live streaming',
    subject: 'New live',
    desc: 'Notification email will be sent to followers once the model go live'
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
