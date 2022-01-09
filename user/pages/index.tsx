/* eslint-disable camelcase */
import {
  Form, Input, Button, Row, Col, Divider, Layout, message
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import {
  login, loginSuccess, loginSocial
} from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { authService, userService } from '@services/index';
import Link from 'next/link';
import { ISettings, IUIConfig } from 'src/interfaces';
import Router from 'next/router';
import { TwitterOutlined } from '@ant-design/icons';
import GoogleLogin from 'react-google-login';
import Loader from '@components/common/base/loader';
import './auth/index.less';

interface IProps {
  loginAuth: any;
  login: Function;
  updateCurrentUser: Function;
  loginSuccess: Function;
  loginSocial: Function;
  ui: IUIConfig;
  settings: ISettings;
  oauth_verifier: string;
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
  }

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
    if (!resp?.tokenId) {
      return;
    }
    const { loginSocial: handleLogin } = this.props;
    const { loginAs } = this.state;
    const payload = { tokenId: resp.tokenId, role: loginAs };
    try {
      await this.setState({ isLoading: true });
      const response = await (await authService.loginGoogle(payload)).data;
      response.token && handleLogin({ token: response.token });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Google authentication login fail');
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
      user.data.isPerformer ? Router.push({ pathname: '/model/profile', query: { username: user.data.username || user.data._id } }, `/${user.data.username || user.data._id}`) : Router.push('/home');
    } catch {
      this.setState({ isLoading: false });
    }
  }

  async callbackTwitter() {
    const { oauth_verifier, loginSocial: handleLogin } = this.props;
    const twitterInfo = authService.getTwitterToken();
    if (!oauth_verifier || !twitterInfo.oauthToken || !twitterInfo.oauthTokenSecret) {
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
        authService.setTwitterToken({ oauthToken: resp.oauthToken, oauthTokenSecret: resp.oauthTokenSecret }, loginAs);
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
    const { ui, settings, loginAuth } = this.props;
    const { isLoading } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
          </title>
          <meta name="keywords" content={settings && settings.metaKeywords} />
          <meta
            name="description"
            content={settings && settings.metaDescription}
          />
          {/* OG tags */}
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content={ui && ui.siteName}
          />
          <meta property="og:image" content={ui && ui.logo} />
          <meta
            property="og:description"
            content={settings && settings.metaDescription}
          />
          {/* Twitter tags */}
          <meta name="twitter:card" content="summary" />
          <meta
            name="twitter:title"
            content={ui && ui.siteName}
          />
          <meta name="twitter:image" content={ui && ui.logo} />
          <meta
            name="twitter:description"
            content={settings && settings.metaDescription}
          />
        </Head>
        <div className="main-container">
          <div className="login-box">
            <Row>
              <Col
                xs={24}
                sm={24}
                md={12}
                lg={12}
              >
                <div className="login-content left" style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null} />
              </Col>
              <Col
                xs={24}
                sm={24}
                md={12}
                lg={12}
              >
                <div className="login-content right">
                  <div className="login-logo"><a href="/">{ui.logo ? <img alt="logo" src={ui.logo} height="80px" /> : ui.siteName}</a></div>
                  <p className="text-center"><small>Sign up to make money and interact with your fans!</small></p>
                  <div className="social-login">
                    <button type="button" disabled={!settings.twitterClientId} onClick={() => this.loginTwitter()} className="twitter-button">
                      <TwitterOutlined />
                      {' '}
                      LOG IN / SIGN UP WITH TWITTER
                    </button>
                    <GoogleLogin
                      className="google-button"
                      clientId={settings.googleClientId}
                      buttonText="LOG IN / SIGN UP WITH GOOGLE"
                      onSuccess={this.onGoogleLogin.bind(this)}
                      onFailure={this.onGoogleLogin.bind(this)}
                      cookiePolicy="single_host_origin"
                    />
                  </div>
                  <Divider>Or</Divider>
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
                          { required: true, message: 'Email or Username is missing' }
                        ]}
                      >
                        <Input disabled={loginAuth.requesting || isLoading} placeholder="Email or Username" />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          { required: true, message: 'Please enter your password!' }
                        ]}
                      >
                        <Input.Password disabled={loginAuth.requesting || isLoading} placeholder="Password" />
                      </Form.Item>
                      <p style={{ padding: '0 20px' }}>
                        <Link
                          href={{
                            pathname: '/auth/forgot-password'
                          }}
                        >
                          <a className="sub-text">Forgot password?</a>
                        </Link>
                      </p>
                      {/* <GoogleReCaptcha ui={ui} handleVerify={this.handleVerifyCapcha.bind(this)} /> */}
                      <Form.Item style={{ textAlign: 'center' }}>
                        <Button disabled={loginAuth.requesting || isLoading} loading={loginAuth.requesting || isLoading} type="primary" htmlType="submit" className="login-form-button">
                          LOG IN
                        </Button>
                        <p style={{ fontSize: 11 }}>
                          Visit
                          {' '}
                          <a href="/page/help">Help Center</a>
                          {' '}
                          for any help if you are not able to login with your existing
                          {' '}
                          {ui?.siteName || 'Fanso'}
                          {' '}
                          account
                        </p>
                        <Divider style={{ margin: '15px 0' }} />
                        <p style={{ marginBottom: 5 }}>
                          Don&apos;t have an account yet?
                        </p>
                        <p>
                          <Link href="/auth/register">
                            <a>
                              Sign up for
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
  login, loginSocial, loginSuccess, updateCurrentUser
};
export default connect(mapStatesToProps, mapDispatchToProps)(Login);
