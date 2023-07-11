import { getResponseError } from '@lib/utils';
import { languageService } from '@services/language.service';
import { message, Select } from 'antd';
import { SelectProps } from 'antd/lib/select';
import React, { useEffect, useState, useMemo } from 'react';
import { ILocale } from 'src/interfaces';

const { Option } = Select;

interface P extends SelectProps<string | string[]> {
  initialLocales?: ILocale[];
}

const SearchLocales = ({ initialLocales, ...props }: P) => {
  const [locales, setLocales] = useState(initialLocales || []);
  useEffect(() => {
    const getLocales = async () => {
      try {
        const resp = await languageService.locales();
        setLocales(resp.data);
      } catch (e) {
        const error = await Promise.resolve(e);
        message.error(getResponseError(error));
      }
    };
    !locales.length && getLocales();
  }, []);

  const renderLocaleOption = useMemo(
    () => locales.map((locale) => (
      <Option key={locale.langCultureName} value={locale.langCultureName}>
        {locale.langCultureName}
        -
        {locale.displayName}
      </Option>
    )),
    [locales]
  );

  return <Select {...props}>{renderLocaleOption}</Select>;
};

SearchLocales.defaultProps = {
  initialLocales: []
};
export default React.memo(SearchLocales);
