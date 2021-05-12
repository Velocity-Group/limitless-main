/* eslint-disable prefer-promise-reject-errors */
import {
  Row, Col, Button, Layout, Form, Input, message,
  Divider
} from 'antd';
import { PureComponent } from 'react';
import Link from 'next/link';
import { registerFan, loginSocial } from '@redux/auth/actions';
import { connect } from 'react-redux';
import Head from 'next/head';
import { IUIConfig } from 'src/interfaces';
// import { GoogleReCaptcha } from '@components/common';
import { TwitterOutlined } from '@ant-design/icons';
import { authService } from '@services/auth.service';
import Loader from '@components/common/base/loader';
import GoogleLogin from 'react-google-login';
import './index.less';

interface IProps {
  ui: IUIConfig;
  registerFan: Function;
  registerFanData: any;
  loginSocial: Function;
}

class FanRegister extends PureComponent<IProps> {
  static authenticate: boolean = false;

  static layout = 'blank';

  recaptchaSuccess = false;

  state = {
    isLoading: false
  }

  handleRegister = (data: any) => {
    const { registerFan: handleRegister } = this.props;
    // if (!this.recaptchaSuccess && ui.enableGoogleReCaptcha) {
    //   message.error('Are you a robot?');
    //   return;
    // }
    handleRegister(data);
  };

  handleVerifyCapcha(resp: any) {
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
    const payload = { tokenId: resp.tokenId, role: 'user' };
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

  async loginTwitter() {
    try {
      await this.setState({ isLoading: true });
      const resp = await (await authService.loginTwitter()).data;
      if (resp && resp.url) {
        authService.setTwitterToken({ oauthToken: resp.oauthToken, oauthTokenSecret: resp.oauthTokenSecret }, 'user');
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
    const {
      ui, registerFanData
    } = this.props;
    const { requesting: submiting } = registerFanData;
    const { isLoading } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Sign up
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box">
            <Row>
              <Col
                xs={24}
                sm={24}
                md={6}
                lg={12}
                className="login-content left fixed"
                style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null}
              />
              <Col
                xs={24}
                sm={24}
                md={18}
                lg={12}
                className="login-content right"
              >
                <div className="title">FAN SIGN UP</div>
                <p className="text-center"><small>Sign up to interact with your idols!</small></p>
                <div className="social-login">
                  <button type="button" onClick={() => this.loginTwitter()} className="twitter-button">
                    <TwitterOutlined />
                    {' '}
                    SIGN UP WITH TWITTER
                  </button>
                  <GoogleLogin
                    className="google-button"
                    clientId={ui.googleClientId}
                    buttonText="SIGN UP WITH GOOGLE"
                    onSuccess={this.onGoogleLogin.bind(this)}
                    onFailure={this.onGoogleLogin.bind(this)}
                    cookiePolicy="single_host_origin"
                  />
                </div>
                <Divider>Or</Divider>
                <div className="login-form">
                  <Form
                    labelCol={{ span: 24 }}
                    name="member_register"
                    initialValues={{ remember: true, gender: 'male' }}
                    onFinish={this.handleRegister.bind(this)}
                  >
                    <Form.Item
                      name="email"
                      validateTrigger={['onChange', 'onBlur']}
                      hasFeedback
                      rules={[
                        {
                          type: 'email',
                          message: 'Invalid email address!'
                        },
                        {
                          required: true,
                          message: 'Please input your email address!'
                        }
                      ]}
                    >
                      <Input placeholder="E-mail" />
                    </Form.Item>
                    <Form.Item
                      name="username"
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        { required: true, message: 'Please input your username!' },
                        {
                          pattern: new RegExp(/^[a-z0-9]+$/g),
                          message:
                                'Username must contain lowercase alphanumerics only'
                        },
                        { min: 3, message: 'Username must containt at least 3 characters' }
                      ]}
                      hasFeedback
                    >
                      <Input placeholder="Username" />
                    </Form.Item>
                    <Form.Item
                      name="name"
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        { required: true, message: 'Please input your display name!' },
                        {
                          pattern: new RegExp(/^(?=.*\S).+$/g),
                          message:
                                'Display name can not contain only whitespace'
                        },
                        {
                          min: 3,
                          message: 'Display name must containt at least 3 characters'
                        }
                      ]}
                      hasFeedback
                    >
                      <Input placeholder="Display name" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      validateTrigger={['onChange', 'onBlur']}
                      hasFeedback
                      rules={[
                        {
                          pattern: new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/g),
                          message: 'Password must have minimum 8 characters, at least one uppercase letter, one lowercase letter and one number'
                        },
                        { required: true, message: 'Please input your password!' }
                      ]}
                    >
                      <Input.Password placeholder="Password" />
                    </Form.Item>
                    {/* <GoogleReCaptcha ui={ui} handleVerify={this.handleVerifyCapcha.bind(this)} /> */}
                    <Form.Item style={{ textAlign: 'center' }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="login-form-button"
                        disabled={submiting}
                        loading={submiting}
                      >
                        SIGN UP
                      </Button>
                      <p>
                        By signing up you agree to our
                        {' '}
                        <a href="/page/tos" target="_blank">Terms of Service</a>
                        {' '}
                        and
                        {' '}
                        <a href="/page/privacy_policy" target="_blank">Privacy & Policy</a>
                        , and confirm that you are at least 18 years old.
                      </p>
                      <p>
                        Have an account already?
                        <Link href="/">
                          <a> Login.</a>
                        </Link>
                      </p>
                      <p>
                        Are you a model?
                        <Link href="/auth/model-register">
                          <a> Sign up here.</a>
                        </Link>
                      </p>
                    </Form.Item>
                  </Form>
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
  registerFanData: { ...state.auth.registerFanData }
});

const mapDispatchToProps = { registerFan, loginSocial };

export default connect(mapStatesToProps, mapDispatchToProps)(FanRegister);
