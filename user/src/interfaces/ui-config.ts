import { ICountry } from './utils';

export interface IUIConfig {
  collapsed: boolean;
  theme: string;
  siteName: string;
  logo: string;
  fixedHeader: boolean;
  menus: any[];
  favicon: string;
  loginPlaceholderImage?: string;
  footerContent: string;
  countries?: ICountry[];
  userBenefit: string;
  modelBenefit: string;
}
