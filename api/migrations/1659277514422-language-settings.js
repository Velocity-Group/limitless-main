/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');
const { DB, COLLECTION } = require('./lib');

module.exports.up = async (next) => {
  const localesDir = join(__dirname, 'locales', 'en.json');
  if (!existsSync(localesDir)) {
    return;
  }
  const resource = readFileSync(localesDir).toString();
  const keys = [];
  const json = JSON.parse(resource);
  Object.keys(json).forEach((key) => keys.push(key));
  for (const key of keys) {
    const data = await DB.collection(COLLECTION.LANGUAGE_SETTING).findOne({ key, locale: 'en-US' });
    if (!data) {
      await DB.collection(COLLECTION.LANGUAGE_SETTING).insertOne({
        key, value: json[key], locale: 'en-US', createdAt: new Date(), updatedAt: new Date()
      });
      console.log(`Key ${key} Added`);
    } else {
      console.log(`Key ${key} Migrated`);
    }
  }
  next();
};

module.exports.down = (next) => {
  next();
};
