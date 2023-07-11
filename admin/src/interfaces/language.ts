export interface ILanguage {
  _id: string;
  key: string;
  value: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocale {
  langCultureName: string;
  displayName: string;
  cultureCode: string;
}
