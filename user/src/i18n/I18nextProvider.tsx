import { useRouter } from 'next/router';
import {
  useMemo, useEffect, createElement, useState, ReactNode
} from 'react';
import { IntlProvider, IntlConfig, ReactIntlErrorCode } from 'react-intl';
import LanguageDetector from 'i18next-browser-languagedetector';
import { updateSettings } from '@redux/settings/actions';
import { updateI18next } from '@redux/i18n/action';
import { updateUIValue } from '@redux/ui/actions';
import { connect } from 'react-redux';
import { isLocale } from 'src/lib/utils';
import { languageService, settingService } from '@services/index';

interface P
  extends Omit<
  IntlConfig,
  | 'locale'
  | 'messages'
  | 'formats'
  | 'timeZone'
  | 'textComponent'
  | 'defaultFormats'
  | 'onError'
  > {
  children: ReactNode;
  lang: string;
  // keys: string[],
  messages: Record<string, string>;
  updateSettings: Function;
  updateI18next: Function;
  updateUIValue: Function;
}

const languageDetector = new LanguageDetector();
const services = {
  languageUtils: {}
};
languageDetector.init(services, {
  // keys or params to lookup language from
  lookupLocalStorage: process.env.NEXT_PUBLIC_LOOKUP_LOCAL_STORAGE,
  lookupSessionStorage: process.env.NEXT_PUBLIC_LOOKUP_SESSION_STORAGE,
  lookupCookie: process.env.NEXT_PUBLIC_LOOKUP_COOKIE,
  caches: ['localStorage', 'cookie', 'sessionStorage']
});

const I18nextProvider = ({
  lang,
  defaultLocale,
  children,
  messages,
  updateSettings: dispatchUpdateSettings,
  updateI18next: dispatchUpdateI18next,
  updateUIValue: dispatchUpdateUIValue
}: P) => {
  const router = useRouter();
  const [routerChanged, setRouterChanged] = useState(false);
  const onError = (e) => {
    if (e.code === ReactIntlErrorCode.MISSING_DATA) {
      return;
    }

    if (
      !process.env.DEBUG
      && [
        ReactIntlErrorCode.INVALID_CONFIG,
        ReactIntlErrorCode.MISSING_TRANSLATION
      ].includes(e.code)
    ) {
      return;
    }

    // eslint-disable-next-line no-console
    process.env.DEBUG && console.error(e);
  };

  useEffect(() => {
    const { isReady } = router;
    if (isReady && !lang) {
      // ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag']
      const detectionOrder = [
        'localStorage',
        'sessionStorage',
        'navigator',
        'htmlTag'
      ];
      const detected = languageDetector.detect(detectionOrder);
      if (detected && isLocale(detected)) {
        dispatchUpdateSettings({ locale: detected });
      } else {
        dispatchUpdateSettings({ locale: defaultLocale });
      }
    }

    const handleRouteChange = () => {
      !routerChanged && setRouterChanged(true);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    const { isReady } = router;
    if (isReady && lang) {
      languageDetector.cacheUserLanguage(lang);
      const loadMessage = async () => {
        // const resp = await languageService.search({ locale: lang });
        // dispatchUpdateI18next(resp.data.data || []);
        const resp = await Promise.all([
          languageService.search({ locale: lang }),
          settingService.all('all', true, {
            'Content-Language': lang
          })
        ]);
        dispatchUpdateI18next(resp[0].data.data || []);
        dispatchUpdateUIValue(resp[1].data);
      };
      loadMessage();
    }
  }, [lang]);

  useEffect(() => {
    if (!routerChanged) return;

    // const _locale = (router.query[lookupQuerystring] as string) || router.locale;
    const _locale = (router.query[process.env.NEXT_PUBLIC_LOOKUP_QUERY_STRING || 'locale'] as string) || router.locale;
    const detected = isLocale(_locale) && _locale;
    if (detected && lang !== detected) dispatchUpdateSettings({ locale: detected });
  }, [router.query, router.locale, routerChanged]);

  const props: IntlConfig = useMemo(
    () => ({
      locale: lang || defaultLocale,
      messages,
      onError
    }),
    [lang, defaultLocale, messages]
  );

  return createElement(
    IntlProvider,
    {
      ...props
    },
    children
  );
};

I18nextProvider.displayname = 'I18nextProvider';
// I18nextProvider.defaultProps = {
//   updateSettings: null,
//   updateI18next: null
// };
const mapStateToProps = (state) => ({
  lang: state.settings.locale,
  messages: state.i18n.messages
});
const mapDispatchToProps = { updateSettings, updateI18next, updateUIValue };
export default connect(mapStateToProps, mapDispatchToProps)(I18nextProvider);
