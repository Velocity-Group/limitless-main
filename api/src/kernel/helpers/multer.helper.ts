import * as StringHelper from './string.helper';

// eslint-disable-next-line no-undef
export const formatFileName = (file: Express.Multer.File) => {
  const ext = (
    StringHelper.getExt(file.originalname) || ''
  ).toLocaleLowerCase();
  const orgName = StringHelper.getFileName(file.originalname, true);
  const randomText = StringHelper.randomString(5); // avoid duplicated name, we might check file name first?
  return (
    StringHelper.createAlias(`${randomText}-${orgName}`).toLocaleLowerCase()
    + ext
  );
};
