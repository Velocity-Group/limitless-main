import {
  cloneDeep
} from 'lodash';
import * as pathToRegexp from 'path-to-regexp';

/**
 * Convert an array to a tree-structured array.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @param   {string}    parentId       The alias of the parent ID of the object in the array.
 * @param   {string}    children  The alias of children of the object in the array.
 * @return  {array}    Return a tree-structured array.
 */
export function arrayToTree(
  array,
  id = 'id',
  parentId = 'pid',
  children = 'children'
) {
  const result = [];
  const hash = {};
  const data = cloneDeep(array);

  data.forEach((item, index) => {
    hash[data[index][id]] = data[index];
  });

  data.forEach((item) => {
    const hashParent = hash[item[parentId]];
    if (hashParent) {
      !hashParent[children] && (hashParent[children] = []);
      hashParent[children].push(item);
    } else {
      result.push(item);
    }
  });
  return result;
}

/**
 * Whether the path matches the regexp if the language prefix is ignored, https://github.com/pillarjs/path-to-regexp.
 * @param   {string|regexp|array}     regexp     Specify a string, array of strings, or a regular expression.
 * @param   {string}                  pathname   Specify the pathname to match.
 * @return  {array|null}              Return the result of the match or null.
 */
export function pathMatchRegexp(regexp, pathname) {
  return pathToRegexp.pathToRegexp(regexp).exec(pathname);
}

/**
 * In an array of objects, specify an object that traverses the objects whose parent ID matches.
 * @param   {array}     array     The Array need to Converted.
 * @param   {string}    current   Specify the object that needs to be queried.
 * @param   {string}    parentId  The alias of the parent ID of the object in the array.
 * @param   {string}    id        The alias of the unique ID of the object in the array.
 * @return  {array}    Return a key array.
 */
export function queryAncestors(array, current, parentId, id = 'id') {
  const result = [current];
  const hashMap = new Map();
  array.forEach((item) => hashMap.set(item[id], item));

  const getPath = (pr) => {
    const currentParentId = hashMap.get(pr[id])[parentId];
    if (currentParentId) {
      result.push(hashMap.get(currentParentId));
      getPath(hashMap.get(currentParentId));
    }
  };

  getPath(current);
  return result;
}

export function getResponseError(data: any) {
  if (!data) {
    return '';
  }

  if (Array.isArray(data.message)) {
    const item = data.message[0];
    if (!item.constraints) {
      return data.error || 'Bad request!';
    }
    return Object.values(item.constraints)[0];
  }

  // TODO - parse for langauge or others
  return typeof data.message === 'string' ? data.message : 'Bad request!';
}

export const locales = [
  'af-ZA',
  'sq-AL',
  'ar-DZ',
  'ar-BH',
  'ar-EG',
  'ar-IQ',
  'ar-JO',
  'ar-KW',
  'ar-LB',
  'ar-LY',
  'ar-MA',
  'ar-OM',
  'ar-QA',
  'ar-SA',
  'ar-SY',
  'ar-TN',
  'ar-AE',
  'ar-YE',
  'hy-AM',
  'Cy-az-AZ',
  'Lt-az-AZ',
  'eu-ES',
  'be-BY',
  'bg-BG',
  'ca-ES',
  'zh-CN',
  'zh-HK',
  'zh-MO',
  'zh-SG',
  'zh-TW',
  'zh-CHS',
  'zh-CHT',
  'hr-HR',
  'cs-CZ',
  'da-DK',
  'div-MV',
  'nl-BE',
  'nl-NL',
  'en-AU',
  'en-BZ',
  'en-CA',
  'en-CB',
  'en-IE',
  'en-JM',
  'en-NZ',
  'en-PH',
  'en-ZA',
  'en-TT',
  'en-GB',
  'en-US',
  'en-ZW',
  'et-EE',
  'fo-FO',
  'fi-FI',
  'fr-BE',
  'fr-CA',
  'fr-FR',
  'fr-LU',
  'fr-MC',
  'fr-CH',
  'gl-ES',
  'ka-GE',
  'de-AT',
  'de-DE',
  'de-LI',
  'de-LU',
  'de-CH',
  'el-GR',
  'gu-IN',
  'he-IL',
  'hi-IN',
  'hu-HU',
  'id-ID',
  'is-IS',
  'it-IT',
  'it-CH',
  'ja-JP',
  'kn-IN',
  'kk-KZ',
  'ky-KZ',
  'ko-KR',
  'lt-LT',
  'lv-LV',
  'mk-MK',
  'ms-BN',
  'ms-MY',
  'mr-IN',
  'mn-MN',
  'nb-NO',
  'nn-NO',
  'pa-IN',
  'fa-IR',
  'pl-PL',
  'pt-BR',
  'pt-PT',
  'ro-RO',
  'ru-RU',
  'sa-IN',
  'Cy-sr-SP',
  'Lt-sr-SP',
  'sk-SK',
  'sl-SI',
  'es-AR',
  'es-BO',
  'es-CL',
  'es-CO',
  'es-CR',
  'es-DO',
  'es-EC',
  'es-SV',
  'es-GT',
  'es-HN',
  'es-MX',
  'es-NI',
  'es-PA',
  'es-PY',
  'es-PE',
  'es-PR',
  'es-ES',
  'es-UY',
  'es-VE',
  'sw-KE',
  'sv-FI',
  'sv-SE',
  'ta-IN',
  'te-IN',
  'th-TH',
  'tr-TR',
  'tt-RU',
  'uk-UA',
  'ur-PK',
  'Cy-uz-UZ',
  'Lt-uz-UZ',
  'vi-VN',
  'kok-IN',
  'syr-SY',
  'af',
  'ax',
  'al',
  'dz',
  'as',
  'ad',
  'ao',
  'ai',
  'ag',
  'ar',
  'am',
  'aw',
  'au',
  'at',
  'az',
  'bs',
  'bh',
  'bd',
  'bb',
  'by',
  'be',
  'bz',
  'bj',
  'bm',
  'bt',
  'bo',
  'bq',
  'ba',
  'bw',
  'bv',
  'br',
  'io',
  'um',
  'vg',
  'vi',
  'bn',
  'bg',
  'bf',
  'bi',
  'kh',
  'cm',
  'ca',
  'cv',
  'ky',
  'cf',
  'td',
  'cl',
  'cn',
  'cx',
  'cc',
  'co',
  'km',
  'cg',
  'cd',
  'ck',
  'cr',
  'hr',
  'cu',
  'cw',
  'cy',
  'cz',
  'dk',
  'dj',
  'dm',
  'do',
  'ec',
  'eg',
  'sv',
  'gq',
  'er',
  'ee',
  'et',
  'fk',
  'fo',
  'fj',
  'fi',
  'fr',
  'gf',
  'pf',
  'tf',
  'ga',
  'gm',
  'ge',
  'de',
  'gh',
  'gi',
  'gr',
  'gl',
  'gd',
  'gp',
  'gu',
  'gt',
  'gg',
  'gn',
  'gw',
  'gy',
  'ht',
  'hm',
  'va',
  'hn',
  'hk',
  'hu',
  'is',
  'in',
  'id',
  'ci',
  'ir',
  'iq',
  'ie',
  'im',
  'il',
  'it',
  'jm',
  'jp',
  'je',
  'jo',
  'kz',
  'ke',
  'ki',
  'kw',
  'kg',
  'la',
  'lv',
  'lb',
  'ls',
  'lr',
  'ly',
  'li',
  'lt',
  'lu',
  'mo',
  'mk',
  'mg',
  'mw',
  'my',
  'mv',
  'ml',
  'mt',
  'mh',
  'mq',
  'mr',
  'mu',
  'yt',
  'mx',
  'fm',
  'md',
  'mc',
  'mn',
  'me',
  'ms',
  'ma',
  'mz',
  'mm',
  'na',
  'nr',
  'np',
  'nl',
  'nc',
  'nz',
  'ni',
  'ne',
  'ng',
  'nu',
  'nf',
  'kp',
  'mp',
  'no',
  'om',
  'pk',
  'pw',
  'ps',
  'pa',
  'pg',
  'py',
  'pe',
  'ph',
  'pn',
  'pl',
  'pt',
  'pr',
  'qa',
  'xk',
  're',
  'ro',
  'ru',
  'rw',
  'bl',
  'sh',
  'kn',
  'lc',
  'mf',
  'pm',
  'vc',
  'ws',
  'sm',
  'st',
  'sa',
  'sn',
  'rs',
  'sc',
  'sl',
  'sg',
  'sx',
  'sk',
  'si',
  'sb',
  'so',
  'za',
  'gs',
  'kr',
  'ss',
  'es',
  'lk',
  'sd',
  'sr',
  'sj',
  'sz',
  'se',
  'ch',
  'sy',
  'tw',
  'tj',
  'tz',
  'th',
  'tl',
  'tg',
  'tk',
  'to',
  'tt',
  'tn',
  'tr',
  'tm',
  'tc',
  'tv',
  'ug',
  'ua',
  'ae',
  'gb',
  'us',
  'uy',
  'uz',
  'vu',
  've',
  'vn',
  'wf',
  'eh',
  'ye',
  'zm',
  'zw'
];

export function isLocale(locale: string | string[]) {
  // const regex = new RegExp('^[A-Za-z]{2,4}([_-][A-Za-z]{4})?([_-]([A-Za-z]{2}|[0-9]{3}))?$', 'g');
  if (Array.isArray(locale)) {
    return locales.includes(locale[0]);
  }

  return locales.includes(locale);
}
