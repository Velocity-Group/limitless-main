import { PureComponent } from 'react';
import Link from 'next/link';
import { connect } from 'react-redux';
import { IUser, IUIConfig, ICountry } from 'src/interfaces';
import { withRouter, NextRouter } from 'next/router';
import { languageService } from '@services/language.service';
import { injectIntl, IntlShape } from 'react-intl';
import { Button, Select } from 'antd';
import './footer.less';
import { cookieService } from '@services/index';

interface IProps {
  currentUser: IUser;
  ui: IUIConfig;
  router: NextRouter;
  customId?: string;
  supportedLocales: string[];
  intl: IntlShape,
  countries: ICountry[]
}

class Footer extends PureComponent<IProps> {
  state = {
    locales: [],
    loading: false,
    success: false,
    currentLang: {} as any
  };

  // eslint-disable-next-line react/sort-comp
  getCookie() {
    const { locales } = this.state;
    const langCookie = cookieService.getCookie('i18next');
    const lang = (locales || []).find((l) => l.langCultureName === langCookie);
    this.setState({ currentLang: lang });
  }

  componentDidMount() {
    this.loadLocales();
    this.renderLanguageMenu();
  }

  componentDidUpdate() {
    this.getCookie();
  }

  renderFlag = (locale) => {
    const { countries } = this.props;
    const country = countries.find((c) => locale.langCultureName.includes(c.code));
    return country?.flag;
  }

  // eslint-disable-next-line react/sort-comp
  loadLocales = async () => {
    try {
      this.setState({ loading: true });
      const resp = await languageService.locales();
      this.setState({ locales: resp?.data || [], success: true });
    } catch {
      this.setState({ success: true });
    } finally {
      this.setState({ loading: false });
    }
  };

  renderLanguageMenu = () => {
    const { router } = this.props;
    const {
      locales, loading, success, currentLang
    } = this.state;
    const {
      supportedLocales = []
      // router: { query, pathname, asPath }
    } = this.props;
    if (loading || !success || !locales.length || !supportedLocales.length) {
      return [];
    }

    const results = [];
    const handleClick = (locale) => {
      router.push(router.asPath, router.asPath, { locale });
    };
    locales
      .filter((data) => supportedLocales.includes(data.langCultureName))
      .forEach((data) => {
        results.push(
          <Select.Option
            key={data.langCultureName}
            value={data.langCultureName}
            disabled={data.langCultureName === currentLang?.langCultureName}
          >
            <Button
              disabled={data.langCultureName === currentLang?.langCultureName}
              onClick={() => handleClick(data.langCultureName)}
              className="btn-select"
            >
              <img src={this.renderFlag(data)} alt="flag" height={30} />
              {' '}
              {data.displayName}
            </Button>
          </Select.Option>
        );
      });
    return results;
  };

  render() {
    const {
      ui, currentUser, router, customId, intl
    } = this.props;
    const { currentLang } = this.state;
    // const country = countries.length && countries.find((c) => c.name === currentLang?.displayName);
    // console.log(country, 'country');
    const menus = ui.menus && Array.isArray(ui.menus) && ui.menus.length > 0
      ? ui.menus.filter((m) => m.section === 'footer')
      : [];
    // const country = countries.find()
    return (
      <div className="main-footer" id={customId || 'main-footer'}>
        <div className="main-container">
          <div className="language-wrapper">
            <h4>
              {intl.formatMessage({
                id: 'chooseLanguage',
                defaultMessage: 'Choose Language'
              })}
            </h4>
            <Select className="langs-select" value={currentLang?.displayName}>{this.renderLanguageMenu()}</Select>
          </div>
          <ul>
            {!currentUser._id ? (
              <>
                <li key="login" className={router.pathname === '/auth/login' ? 'active' : ''}>
                  <Link href="/auth/login">
                    <a>{intl.formatMessage({ id: 'login', defaultMessage: 'Login' })}</a>
                  </Link>
                </li>
                <li key="signup" className={router.pathname === '/auth/register' ? 'active' : ''}>
                  <Link href="/auth/register">
                    <a>{intl.formatMessage({ id: 'signUp', defaultMessage: 'Sign Up' })}</a>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li key="home" className={router.pathname === '/home' ? 'active' : ''}>
                  <Link href="/home">
                    <a>{intl.formatMessage({ id: 'home', defaultMessage: 'Home' })}</a>
                  </Link>
                </li>
                <li key="model" className={router.pathname === '/model' ? 'active' : ''}>
                  <Link href="/model">
                    <a>{intl.formatMessage({ id: 'model', defaultMessage: 'Model' })}</a>
                  </Link>
                </li>
                <li key="contact" className={router.pathname === '/contact' ? 'active' : ''}>
                  <Link href="/contact">
                    <a>{intl.formatMessage({ id: 'contact', defaultMessage: 'Contact' })}</a>
                  </Link>
                </li>
              </>
            )}
            {menus
              && menus.length > 0
              && menus.map((item) => (
                <li key={item._id} className={router.pathname === item.path ? 'active' : ''}>
                  <a rel="noreferrer" href={item.path} target={item.isNewTab ? '_blank' : ''}>
                    {intl.formatMessage({ id: item.title, defaultMessage: item.title })}
                  </a>
                </li>
              ))}
          </ul>
          {/* eslint-disable-next-line react/no-danger */}
          {ui.footerContent ? <div className="footer-content" dangerouslySetInnerHTML={{ __html: intl.formatMessage({ id: ui.footerContent, defaultMessage: ui.footerContent }) }} />
            : (
              <div className="copyright-text">
                <span>
                  <Link href="/home">
                    <a>{ui?.siteName}</a>
                  </Link>
                  {' '}
                  {intl.formatMessage({ id: 'copyright', defaultMessage: '© Copyright' })}
                  {' '}
                  {new Date().getFullYear()}
                </span>
              </div>
            )}
        </div>
      </div>
    );
  }
}
const mapState = (state: any) => ({
  currentUser: state.user.current,
  ui: { ...state.ui },
  supportedLocales: state.settings.supportedLocales,
  countries: state.utils.countries
});
export default injectIntl(withRouter(connect(mapState)(Footer))) as any;
