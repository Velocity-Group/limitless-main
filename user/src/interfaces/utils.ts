export interface ISearch {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ICountry {
  name: string;
  code: string;
  flag: string;
}

export interface ILangguges {
  name: string;
  code: string;
}

export interface IPhoneCodes {
  name: string;
  code: string;
  dialCode: string;
}

export interface IBody {
  heights: { value: string; text: string }[];
  weights: { value: string; text: string }[];
  genders: { value: string; text: string }[];
  sexualOrientations: { value: string; text: string }[];
  ages: { value: string; text: string }[];
  eyes: { value: string; text: string }[];
  butts: { value: string; text: string }[];
  pubicHairs: { value: string; text: string }[];
  hairs: { value: string; text: string }[];
  ethnicities: { value: string; text: string }[];
  bodyTypes: { value: string; text: string }[];
}
