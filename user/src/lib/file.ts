export const convertBlobUrlToFile = async (blobUrl: string, fileName: string) => {
  const blob = await fetch(blobUrl).then((r) => r.blob());
  return new File([blob], `${fileName}.${blob.type.split('/')[1]}`, { type: blob.type });
};
