export const urlNormalize = (url: string) => {
  return url.replace(/http(s)?(:)?(\/\/)?|(\/\/)?(www\.)?/, '');
};
