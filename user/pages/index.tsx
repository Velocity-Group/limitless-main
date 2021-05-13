import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Divider,
  Layout,
  message
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
import './auth/index.less';
import { IUIConfig } from 'src/interfaces';
import Router from 'next/router';
import { TwitterOutlined } from '@ant-design/icons';
import Loader from '@components/common/base/loader';
import GoogleLogin from 'react-google-login';
import { isEmail } from '@lib/string';
// import { GoogleReCaptcha } from '@components/common';

interface IProps {
  login: Function;
  updateCurrentUser: Function;
  loginSuccess: Function;
  loginSocial: Function;
  ui: IUIConfig
}

class Login extends PureComponent<IProps> {
  static authenticate: boolean = false;

  static layout = 'blank';

  recaptchaSuccess = false;

  state = {
    loginAs: 'user',
    isLoading: false,
    loginInput: ''
  }

  async componentDidMount() {
    this.redirectLogin();
    this.callbackTwitter();
  }

  async handleLogin(values: any) {
    const { login: handleLogin } = this.props;
    const { loginInput } = this.state;
    // if (!this.recaptchaSuccess && ui.enableGoogleReCaptcha) {
    //   return message.error('Are you a robot?');
    // }
    const data = values;
    const isInputEmail = isEmail(loginInput);
    data.loginUsername = !isInputEmail;
    if (isInputEmail) {
      data.email = loginInput;
    } else {
      data.username = loginInput;
    }
    return handleLogin(data);
  }

  async handleVerifyCapcha(resp: any) {
    if (resp?.data?.success) {
      this.recaptchaSuccess = true;
    } else {
      this.recaptchaSuccess = false;
    }
  }

  async onGoogleLogin(resp: any) {
    if (!resp.tokenId) {
      message.error('Google login authenticated fail');
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
      message.error(error && error.message ? error.message : 'Google login authenticated fail');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  onInputChange(e) {
    if (!e.target.value) return;
    this.setState({ loginInput: e.target.value });
  }

  async redirectLogin() {
    const { loginSuccess: handleLogin, updateCurrentUser: handleUpdateUser } = this.props;
    const token = authService.getToken();
    if (!token || token === 'null') {
      return;
    }
    authService.setToken(token);
    try {
      const user = await userService.me({
        Authorization: token
      });
      if (!user || !user.data || !user.data._id) return;
      handleLogin();
      handleUpdateUser(user.data);
      user.data.isPerformer && user.data.username ? Router.push({ pathname: '/model/profile', query: { username: user.data.username } }, `/${user.data.username}`) : Router.push('/home');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(await e);
    }
  }

  async callbackTwitter() {
    const { loginSocial: handleLogin } = this.props;
    const oauthVerifier = Router.router.query && Router.router.query.oauth_verifier;
    const twitterInfo = authService.getTwitterToken();
    if (!oauthVerifier || !twitterInfo.oauthToken || !twitterInfo.oauthTokenSecret) {
      return;
    }
    try {
      await this.setState({ isLoading: true });
      const auth = await authService.callbackLoginTwitter({
        oauth_verifier: oauthVerifier,
        oauthToken: twitterInfo.oauthToken,
        oauthTokenSecret: twitterInfo.oauthTokenSecret,
        role: twitterInfo.role || 'user'
      });
      auth.data && auth.data.token && handleLogin({ token: auth.data.token });
    } catch (e) {
      const error = await e;
      message.error(error && error.message ? error.message : 'Something went wrong, please try again later');
    } finally {
      this.setState({ isLoading: false });
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
      message.error(error?.message || 'Something went wrong, please try again later');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { ui } = this.props;
    const { isLoading } = this.state;
    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Login
          </title>
        </Head>
        <Layout>
          <div className="main-container">
            <div className="login-box">
              <Row>
                <Col
                  xs={24}
                  sm={24}
                  md={12}
                  lg={12}
                >
                  <div className="login-content left fixed" style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null} />
                </Col>
                <Col
                  xs={24}
                  sm={24}
                  md={12}
                  lg={12}
                >
                  <div className="login-content right">
                    {ui.logo && <div className="login-logo"><a href="/"><img alt="logo" src={ui.logo} height="80px" /></a></div>}
                    <p className="text-center"><small>Sign up to make money and interact with your fans!</small></p>
                    <div className="social-login">
                      <button type="button" onClick={() => this.loginTwitter()} className="twitter-button">
                        <TwitterOutlined />
                        {' '}
                        SIGN IN/ SIGN UP WITH TWITTER
                      </button>
                      <GoogleLogin
                        className="google-button"
                        clientId={ui.googleClientId}
                        buttonText="SIGN IN/ SIGN UP WITH GOOGLE"
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
                          hasFeedback
                          validateTrigger={['onChange', 'onBlur']}
                          rules={[
                            { required: true, message: 'E-mail or Username is missing' }
                          ]}
                        >
                          <Input onChange={this.onInputChange.bind(this)} placeholder="E-mail or Username" />
                        </Form.Item>
                        <Form.Item
                          name="password"
                          hasFeedback
                          validateTrigger={['onChange', 'onBlur']}
                          rules={[
                            { required: true, message: 'Please enter your password!' },
                            { min: 8 }
                          ]}
                        >
                          <Input.Password placeholder="Password" />
                        </Form.Item>
                        <p style={{ padding: '0 5px' }}>
                          <Link
                            href={{
                              pathname: '/auth/forgot-password'
                            }}
                          >
                            <a className="login-form-forgot">Forgot password?</a>
                          </Link>
                        </p>
                        {/* <GoogleReCaptcha ui={ui} handleVerify={this.handleVerifyCapcha.bind(this)} /> */}
                        <Form.Item style={{ textAlign: 'center' }}>
                          <Button type="primary" htmlType="submit" className="login-form-button">
                            LOGIN
                          </Button>
                          <p>
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
              {isLoading && <Loader />}
            </div>
          </div>
        </Layout>
      </>
    );
  }
}

const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui }
});

const mapDispatchToProps = {
  login, loginSocial, loginSuccess, updateCurrentUser
};
export default connect(mapStatesToProps, mapDispatchToProps)(Login) as any;
