/* eslint-disable no-useless-escape */
export function isUrl(url: string): boolean {
  const regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  return regex.test(url);
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isEmail(email: string) {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
}

export const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  /* eslint-disable */
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
})

export const replaceURLs = (str: string) => {
  if (!str) return '';

  const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  const result = str.replace(urlRegex, (url: string) => {
    let hyperlink = url;
    if (!hyperlink.match('^https?:\\/\\/')) {
      hyperlink = `http://${hyperlink}`;
    }
    return `<a href="${hyperlink}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  // eslint-disable-next-line consistent-return
  return result;
}