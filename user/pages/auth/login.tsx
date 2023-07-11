/* eslint-disable camelcase */
import {
  Form, Input, Button, Row, Col, Divider, Layout, message
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { login, loginSuccess, loginSocial } from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { authService, userService } from '@services/index';
import Link from 'next/link';
import { ISettings, IUIConfig } from 'src/interfaces';
import Router from 'next/router';
import { TwitterOutlined } from '@ant-design/icons';
import Loader from '@components/common/base/loader';
import './index.less';
import GoogleLoginButton from '@components/auth/google-login-button';

import { injectIntl, IntlShape } from 'react-intl';

const Translation = dynamic(() => import('src/i18n/Translation'), {
  ssr: false
}) as any;

interface IProps {
  loginAuth: any;
  login: Function;
  updateCurrentUser: Function;
  loginSuccess: Function;
  loginSocial: Function;
  ui: IUIConfig;
  settings: ISettings;
  oauth_verifier: string;
  intl: IntlShape;

}

class Login extends PureComponent<IProps> {
  static authenticate = false;

  static layout = 'blank';

  recaptchaSuccess = false;

  static async getInitialProps({ ctx }) {
    return {
      ...ctx.query
    };
  }

  state = {
    loginAs: 'user',
    isLoading: true
  };

  async componentDidMount() {
    this.redirectLogin();
    this.callbackTwitter();
  }

  async handleLogin(values: any) {
    const { login: handleLogin } = this.props;
    return handleLogin(values);
  }

  async handleVerifyCapcha(resp: any) {
    if (resp?.data?.success) {
      this.recaptchaSuccess = true;
    } else {
      this.recaptchaSuccess = false;
    }
  }

  async onGoogleLogin(resp: any) {
    if (!resp?.credential) {
      return;
    }
    const { loginSocial: handleLogin, intl } = this.props;
    const { loginAs } = this.state;
    const payload = { tokenId: resp.credential, role: loginAs };
    try {
      await this.setState({ isLoading: true });
      const response = await (await authService.loginGoogle(payload)).data;
      response.token && handleLogin({ token: response.token });
    } catch (e) {
      const error = await e;
      if (error?.message) {
        message.error(error.message);
        return;
      }
      message.error(
        intl.formatMessage({
          id: 'googleLoginFail',
          defaultMessage: 'Google authentication login fail'
        })
      );
      // message.error(error?.message || 'Google authentication login fail');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async redirectLogin() {
    const { loginSuccess: handleLogin, updateCurrentUser: handleUpdateUser } = this.props;
    const token = authService.getToken();
    if (!token || token === 'null') {
      this.setState({ isLoading: false });
      return;
    }
    authService.setToken(token);
    try {
      await this.setState({ isLoading: true });
      const user = await userService.me({
        Authorization: token
      });
      if (!user || !user.data || !user.data._id) return;
      handleLogin();
      handleUpdateUser(user.data);
      user.data.isPerformer
        ? Router.push(
          {
            pathname: '/model/profile',
            query: { username: user.data.username || user.data._id }
          },
          `/${user.data.username || user.data._id}`
        )
        : Router.push('/home');
    } catch {
      this.setState({ isLoading: false });
    }
  }

  async callbackTwitter() {
    const { oauth_verifier, loginSocial: handleLogin } = this.props;
    const twitterInfo = authService.getTwitterToken();
    if (
      !oauth_verifier
      || !twitterInfo.oauthToken
      || !twitterInfo.oauthTokenSecret
    ) {
      return;
    }
    try {
      const auth = await authService.callbackLoginTwitter({
        oauth_verifier,
        oauthToken: twitterInfo.oauthToken,
        oauthTokenSecret: twitterInfo.oauthTokenSecret,
        role: twitterInfo.role || 'user'
      });
      auth.data && auth.data.token && handleLogin({ token: auth.data.token });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Twitter authentication login fail');
    }
  }

  async loginTwitter() {
    const { loginAs } = this.state;
    try {
      await this.setState({ isLoading: true });
      const resp = await (await authService.loginTwitter()).data;
      if (resp && resp.url) {
        authService.setTwitterToken(
          {
            oauthToken: resp.oauthToken,
            oauthTokenSecret: resp.oauthTokenSecret
          },
          loginAs
        );
        window.location.href = resp.url;
      }
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Twitter authentication login fail');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const {
      ui, settings, loginAuth, intl
    } = this.props;
    const { isLoading } = this.state;
    return (
      <Layout>
        <Head>
          <title>{ui && ui.siteName}</title>
          <meta name="keywords" content={settings && settings.metaKeywords} />
          <meta
            name="description"
            content={settings && settings.metaDescription}
          />
          {/* OG tags */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={ui && ui.siteName} />
          <meta property="og:image" content={ui && ui.logo} />
          <meta
            property="og:description"
            content={settings && settings.metaDescription}
          />
          {/* Twitter tags */}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={ui && ui.siteName} />
          <meta name="twitter:image" content={ui && ui.logo} />
          <meta
            name="twitter:description"
            content={settings && settings.metaDescription}
          />
        </Head>
        <div className="main-container">
          <div className="login-box">
            <Row>
              <Col xs={24} sm={24} md={12} lg={12}>
                <div
                  className="login-content left"
                  style={
                    ui.loginPlaceholderImage
                      ? { backgroundImage: `url(${ui.loginPlaceholderImage})` }
                      : null
                  }
                />
              </Col>
              <Col xs={24} sm={24} md={12} lg={12}>
                <div className="login-content right">
                  <div className="login-logo">
                    <a href="/auth/login">
                      {ui.logo ? (
                        <img alt="logo" src={ui.logo} height="80px" />
                      ) : (
                        ui.siteName
                      )}
                    </a>
                  </div>
                  <p className="text-center">
                    <small>
                      {intl.formatMessage({
                        id: 'signUpToMakeMoneyAndInteractWithYourFans',
                        defaultMessage:
                          'Sign up to make money and interact with your fans!'
                      })}
                    </small>
                  </p>
                  <div className="social-login">
                    <button
                      type="button"
                      disabled={!settings.twitterClientId}
                      onClick={() => this.loginTwitter()}
                      className="twitter-button"
                    >
                      <TwitterOutlined />
                      {' '}
                      {intl.formatMessage({
                        id: 'loginUpCase',
                        defaultMessage: 'LOG IN'
                      })}
                      {' '}
                      /
                      {' '}
                      {intl.formatMessage({
                        id: 'signUpWithTwitterCase',
                        defaultMessage: 'SIGN UP WITH TWITTER'
                      })}
                    </button>
                    <GoogleLoginButton
                      clientId={settings.googleClientId}
                      onSuccess={this.onGoogleLogin.bind(this)}
                      onFailure={this.onGoogleLogin.bind(this)}
                    />
                  </div>
                  <Divider>
                    {intl.formatMessage({
                      id: 'or',
                      defaultMessage: 'or'
                    })}
                  </Divider>
                  <div className="login-form">
                    <Form
                      name="normal_login"
                      className="login-form"
                      initialValues={{ remember: true }}
                      onFinish={this.handleLogin.bind(this)}
                    >
                      <Form.Item
                        name="username"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'missingEmailOrUsername',
                              defaultMessage: 'Email or Username is missing'
                            })}`
                          }
                        ]}
                      >
                        <Input
                          disabled={loginAuth.requesting || isLoading}
                          placeholder={intl.formatMessage({
                            id: 'emailOrUsername',
                            defaultMessage: 'Email or Username'
                          })}
                        />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'pleaseEnterYourPassword',
                              defaultMessage: 'Please enter your password!'
                            })}`
                          }
                        ]}
                      >
                        <Input.Password
                          disabled={loginAuth.requesting || isLoading}
                          placeholder={intl.formatMessage({
                            id: 'password',
                            defaultMessage: 'Password'
                          })}
                        />
                      </Form.Item>
                      <p style={{ padding: '0 20px' }}>
                        <Link
                          href={{
                            pathname: '/auth/forgot-password'
                          }}
                        >
                          <a className="sub-text">
                            <Translation
                              id="forgotPassword"
                              defaultMessage={intl.formatMessage({
                                id: 'forgotPassword',
                                defaultMessage: 'Forgot password?'
                              })}
                            />
                          </a>
                        </Link>
                      </p>
                      {/* <GoogleReCaptcha ui={ui} handleVerify={this.handleVerifyCapcha.bind(this)} /> */}
                      <Form.Item style={{ textAlign: 'center' }}>
                        <Button
                          disabled={loginAuth.requesting || isLoading}
                          loading={loginAuth.requesting || isLoading}
                          type="primary"
                          htmlType="submit"
                          className="login-form-button"
                        >
                          {intl.formatMessage({
                            id: 'loginUpCase',
                            defaultMessage: 'LOG IN'
                          })}
                        </Button>
                        <p style={{ fontSize: 11 }}>
                          {intl.formatMessage({
                            id: 'visit',
                            defaultMessage: 'Visit'
                          })}
                          {' '}
                          <a href="/page/help">
                            {intl.formatMessage({
                              id: 'helpCenter',
                              defaultMessage: 'Help Center'
                            })}
                          </a>
                          {' '}
                          {intl.formatMessage({
                            id: 'forAnyHelpIfYouAreNotAbleToLoginWithYourExisting',
                            defaultMessage:
                              'for any help if you are not able to login with your existing'
                          })}
                          {' '}
                          {ui?.siteName || 'Fanso'}
                          {' '}
                          {intl.formatMessage({
                            id: 'account',
                            defaultMessage: 'account'
                          })}
                        </p>
                        <Divider style={{ margin: '15px 0' }} />
                        <p style={{ marginBottom: 5 }}>
                          {intl.formatMessage({
                            id: 'dontHaveAnAccountYet',
                            defaultMessage: 'Don\'t have an account yet?'
                          })}
                        </p>
                        <p>
                          <Link href="/auth/register">
                            <a>
                              {intl.formatMessage({
                                id: 'signUpFor',
                                defaultMessage: 'Sign up for'
                              })}
                              {' '}
                              {ui?.siteName}
                            </a>
                          </Link>
                        </p>
                      </Form.Item>
                    </Form>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
        {isLoading && <Loader />}
      </Layout>
    );
  }
}

const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings },
  loginAuth: { ...state.auth.loginAuth }
});

const mapDispatchToProps = {
  login,
  loginSocial,
  loginSuccess,
  updateCurrentUser
};

export default injectIntl(connect(mapStatesToProps, mapDispatchToProps)(Login));
