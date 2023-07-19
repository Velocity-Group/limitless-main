import App from 'next/app';
import React from 'react';
import { Provider } from 'react-redux';
import nextCookie from 'next-cookies';
import withReduxSaga from '@redux/withReduxSaga';
import { Store } from 'redux';
import BaseLayout from '@layouts/base-layout';
import {
  authService, userService, settingService, languageService, utilsService
} from '@services/index';
import Router from 'next/router';
import { NextPageContext } from 'next';
import { loginSuccess } from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { updateUIValue } from '@redux/ui/actions';
import { Socket } from 'src/socket';
import Head from 'next/head';
import { SETTING_KEYS } from 'src/constants';
import { pick } from 'lodash';
import { updateLiveStreamSettings } from '@redux/streaming/actions';
import { updateSettings } from '@redux/settings/actions';
import { setGlobalConfig } from '@services/config';

import I18nextProvider from 'src/i18n/I18nextProvider';
import { updateI18next } from '@redux/i18n/action';
import { isLocale } from 'src/lib/utils';
import { ConfigProvider } from 'antd';

import '../style/index.less';
import { updateUtils } from '@redux/utils/actions';

export const DEFAULT_LOCALE = 'en-US';

declare global {
  interface Window {
    ReactSocketIO: any;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
    iframely: any;
  }
}

function redirectLogin(ctx: any) {
  if (process.browser) {
    authService.removeToken();
    Router.push('/auth/login');
    return;
  }

  // fix for production build
  ctx.res.clearCookie && ctx.res.clearCookie('token');
  ctx.res.clearCookie && ctx.res.clearCookie('role');
  ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/' });
  ctx.res.end && ctx.res.end();
}

async function auth(
  ctx: NextPageContext,
  noredirect: boolean,
  onlyPerformer: boolean
) {
  try {
    const { store } = ctx;
    const state = store.getState();
    const { token } = nextCookie(ctx);
    if (state.auth && state.auth.loggedIn) {
      return;
    }
    if (token) {
      authService.setToken(token);
      const user = await userService.me({
        Authorization: token
      });
      if (!user.data || !user.data._id) {
        redirectLogin(ctx);
        return;
      }
      if (!user.data.isPerformer && onlyPerformer) {
        redirectLogin(ctx);
        return;
      }
      // console.log(user);
      store.dispatch(loginSuccess());
      store.dispatch(updateCurrentUser(user.data));
      return;
    }
    !noredirect && redirectLogin(ctx);
  } catch (e) {
    redirectLogin(ctx);
  }
}

async function updateSettingsStore(ctx: NextPageContext, settings) {
  const { store } = ctx;
  store.dispatch(
    updateUIValue({
      logo: settings.logoUrl || '',
      siteName: settings.siteName || '',
      favicon: settings.favicon || '',
      loginPlaceholderImage: settings.loginPlaceholderImage || '',
      menus: settings.menus || [],
      footerContent: settings.footerContent || '',
      countries: settings.countries || [],
      userBenefit: settings.userBenefit || '',
      modelBenefit: settings.modelBenefit || ''
    })
  );
  store.dispatch(
    updateLiveStreamSettings(
      pick(settings, [
        SETTING_KEYS.VIEWER_URL,
        SETTING_KEYS.PUBLISHER_URL,
        SETTING_KEYS.SUBSCRIBER_URL,
        SETTING_KEYS.OPTION_FOR_BROADCAST,
        SETTING_KEYS.OPTION_FOR_PRIVATE,
        SETTING_KEYS.SECURE_OPTION,
        SETTING_KEYS.ANT_MEDIA_APPNAME,
        SETTING_KEYS.AGORA_APPID,
        SETTING_KEYS.AGORA_ENABLE
      ])
    )
  );

  store.dispatch(
    updateSettings(
      {
        ...pick(settings, [
          SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION,
          SETTING_KEYS.TOKEN_CONVERSION_RATE,
          SETTING_KEYS.STRIPE_PUBLISHABLE_KEY,
          SETTING_KEYS.GOOGLE_RECAPTCHA_SITE_KEY,
          SETTING_KEYS.ENABLE_GOOGLE_RECAPTCHA,
          SETTING_KEYS.GOOGLE_CLIENT_ID,
          SETTING_KEYS.TWITTER_CLIENT_ID,
          SETTING_KEYS.PAYMENT_GATEWAY,
          SETTING_KEYS.META_KEYWORDS,
          SETTING_KEYS.META_DESCRIPTION,
          SETTING_KEYS.VERIFF_ENABLED,
          SETTING_KEYS.VERIFF_BASE_URL,
          SETTING_KEYS.VERIFF_PUBLIC_KEY
        ]),
        locale: settings.locale,
        supportedLocales: settings.supportedLocales
      }
    )
  );

  store.dispatch(
    updateUtils({
      countries: settings.countries
    })
  );

  store.dispatch(updateI18next(settings.messages));
}

interface AppComponent extends NextPageContext {
  layout: string;
}

interface IApp {
  store: Store;
  layout: string;
  Component: AppComponent;
  settings: any;
  config: any;
}

const publicConfig = {} as any;
class Application extends App<IApp> {
  // TODO - consider if we need to use get static props in children component instead?
  // or check in render?
  static async getInitialProps({ Component, ctx, router }) {
    // load configuration from ENV and put to config
    if (!process.browser) {
      // eslint-disable-next-line global-require
      const dotenv = require('dotenv');
      const myEnv = dotenv.config().parsed;

      // publish to server config with app
      setGlobalConfig(myEnv);

      // load public config and api-endpoint?
      Object.keys(myEnv).forEach((key) => {
        if (key.indexOf('NEXT_PUBLIC_') === 0) {
          publicConfig[key] = myEnv[key];
        }
      });
    }

    // won't check auth for un-authenticated page such as login, register
    // use static field in the component
    const { noredirect, onlyPerformer, authenticate } = Component;
    if (authenticate !== false) {
      await auth(ctx, noredirect, onlyPerformer);
    }
    const { token } = nextCookie(ctx);
    ctx.token = token || '';
    // server side to load settings, once time only
    let settings: any = {};
    let locale: string;
    if (!process.browser) {
      const [setting, countryList] = await Promise.all([
        settingService.all('all', true),
        utilsService.countriesList()
      ]);
      const _cookie = nextCookie(ctx);
      // router.locale is default locale when router custom
      // const _locale = router.query[lookupQuerystring] || _cookie[lookupCookie];
      const _locale = router.query[process.env.NEXT_PUBLIC_LOOKUP_QUERY_STRING || 'locale'] || _cookie[process.env.NEXT_PUBLIC_LOOKUP_COOKIE || 'i18nextLng'];
      locale = isLocale(_locale) ? _locale : '';
      const _messages = locale
        ? await languageService.search({ locale })
        : null;

      settings = {
        ...setting.data,
        countries: countryList.data || [],
        messages: _messages?.data?.data || [],
        locale
      };
      await updateSettingsStore(ctx, settings);
    }
    let pageProps = {};
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps({ ctx });
    }
    return {
      settings,
      pageProps,
      layout: Component.layout,
      config: publicConfig
    };
  }

  constructor(props) {
    super(props);
    setGlobalConfig(this.props.config);
  }

  render() {
    const {
      Component, pageProps, store, settings
    } = this.props;
    const { layout } = Component;
    return (
      <Provider store={store}>
        <Head>
          <title>{settings?.siteName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          {/* GA code */}
          {settings && settings.gaCode && [
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaCode}`} />,
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `
                 window.dataLayer = window.dataLayer || [];
                 function gtag(){dataLayer.push(arguments);}
                 gtag('js', new Date());
                 gtag('config', '${settings.gaCode}');
             `
              }}
            />
          ]}
          {/* extra script */}
          {settings && settings.headerScript && (
            // eslint-disable-next-line react/no-danger
            <div dangerouslySetInnerHTML={{ __html: settings.headerScript }} />
          )}
        </Head>
        <Socket>
          <I18nextProvider defaultLocale={settings.defaultLocale || DEFAULT_LOCALE}>
            <ConfigProvider>
              <BaseLayout layout={layout} maintenance={settings.maintenanceMode}>
                <Component {...pageProps} />
              </BaseLayout>
            </ConfigProvider>
          </I18nextProvider>
        </Socket>
        {settings && settings.afterBodyScript && (
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: settings.afterBodyScript }} />
        )}
      </Provider>
    );
  }
}

export default withReduxSaga(Application);
