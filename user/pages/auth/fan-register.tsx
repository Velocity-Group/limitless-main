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
import { ISettings, IUIConfig } from 'src/interfaces';
// import { GoogleReCaptcha } from '@components/common';
import { TwitterOutlined } from '@ant-design/icons';
import { authService } from '@services/auth.service';
import GoogleLogin from 'react-google-login';
import './index.less';

interface IProps {
  ui: IUIConfig;
  settings: ISettings;
  registerFan: Function;
  registerFanData: any;
  loginSocial: Function;
}

class FanRegister extends PureComponent<IProps> {
  static authenticate = false;

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
    if (!resp?.tokenId) {
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
      ui, registerFanData, settings
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
            <p className="text-center">
              <small>
                Do not create an account on this page if you are a model. Models must create an account on
                {' '}
                <a href="/auth/model-register">this link</a>
              </small>
            </p>
            <Row>
              <Col
                xs={24}
                sm={24}
                md={6}
                lg={12}
              >
                <div
                  className="login-content left"
                  style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null}
                />
              </Col>
              <Col
                xs={24}
                sm={24}
                md={18}
                lg={12}
              >
                <div className="login-content right">
                  <div className="title">Fan Sign Up</div>
                  <p className="text-center"><small>Sign up to interact with your idols!</small></p>
                  <div className="social-login">
                    <button type="button" disabled={!settings.twitterClientId} onClick={() => this.loginTwitter()} className="twitter-button">
                      <TwitterOutlined />
                      {' '}
                      SIGN UP WITH TWITTER
                    </button>
                    <GoogleLogin
                      className="google-button"
                      clientId={settings.googleClientId}
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
                      scrollToFirstError
                    >
                      <Form.Item
                        name="firstName"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          { required: true, message: 'Please input your name!' },
                          {
                            pattern: new RegExp(
                              /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
                            ),
                            message:
                              'First name can not contain number and special character'
                          }
                        ]}
                      >
                        <Input placeholder="First name" />
                      </Form.Item>
                      <Form.Item
                        name="lastName"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          { required: true, message: 'Please input your name!' },
                          {
                            pattern: new RegExp(
                              /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
                            ),
                            message:
                              'Last name can not contain number and special character'
                          }
                        ]}
                      >
                        <Input placeholder="Last name" />
                      </Form.Item>
                      <Form.Item
                        name="email"
                        validateTrigger={['onChange', 'onBlur']}
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
                        <Input placeholder="Email address" />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                            message: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                          },
                          { required: true, message: 'Please enter your password!' }
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
                          disabled={submiting || isLoading}
                          loading={submiting || isLoading}
                        >
                          SIGN UP
                        </Button>
                        <p>
                          By signing up you agree to our
                          {' '}
                          <a href="/page/terms-of-service" target="_blank">Terms of Service</a>
                          {' '}
                          and
                          {' '}
                          <a href="/page/privacy-policy" target="_blank">Privacy Policy</a>
                          , and confirm that you are at least 18 years old.
                        </p>
                        <p>
                          Have an account already?
                          <Link href="/">
                            <a> Log in here.</a>
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
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Layout>
    );
  }
}
const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings },
  registerFanData: { ...state.auth.registerFanData }
});

const mapDispatchToProps = { registerFan, loginSocial };

export default connect(mapStatesToProps, mapDispatchToProps)(FanRegister);
