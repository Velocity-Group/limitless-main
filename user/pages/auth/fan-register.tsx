/* eslint-disable prefer-promise-reject-errors */
import {
  Row, Col, Button, Layout, Form, Input, message, Divider
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
import './index.less';
import GoogleLoginButton from '@components/auth/google-login-button';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  settings: ISettings;
  registerFan: Function;
  registerFanData: any;
  loginSocial: Function;
  intl: IntlShape;
}

class FanRegister extends PureComponent<IProps> {
  static authenticate = false;

  static layout = 'blank';

  recaptchaSuccess = false;

  state = {
    isLoading: false
  };

  handleRegister = (data: any) => {
    const { registerFan: handleRegister } = this.props;
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
    if (!resp?.credential) {
      return;
    }
    const { loginSocial: handleLogin, intl } = this.props;
    const payload = { tokenId: resp.credential, role: 'user' };
    try {
      await this.setState({ isLoading: true });
      const response = await (await authService.loginGoogle(payload)).data;
      response.token && handleLogin({ token: response.token });
    } catch (e) {
      const error = await e;
      message.error(
        error && error.message
          ? error.message
          : `${intl.formatMessage({
            id: 'googleLoginAuthenticatedFail',
            defaultMessage: 'Google login authenticated fail'
          })}`
      );
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async loginTwitter() {
    const { intl } = this.props;
    try {
      await this.setState({ isLoading: true });
      const resp = await (await authService.loginTwitter()).data;
      if (resp && resp.url) {
        authService.setTwitterToken(
          {
            oauthToken: resp.oauthToken,
            oauthTokenSecret: resp.oauthTokenSecret
          },
          'user'
        );
        window.location.href = resp.url;
      }
    } catch (e) {
      const error = await e;
      message.error(
        error?.message
          || `${intl.formatMessage({
            id: 'somethingWentWrong',
            defaultMessage: 'Something went wrong, please try again!'
          })}`
      );
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    const {
      ui, registerFanData, settings, intl
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
                {intl.formatMessage({
                  id: 'doNotCreateAnAccountOnThisPageIfYouAreAModelModelsMustCreateAnAccountOn',
                  defaultMessage:
                    'Do not create an account on this page if you are a model. Models must create an account on'
                })}
                {' '}
                <a href="/auth/model-register">
                  {intl.formatMessage({
                    id: 'thisLink',
                    defaultMessage: 'this link'
                  })}
                </a>
              </small>
            </p>
            <Row>
              <Col xs={24} sm={24} md={6} lg={12}>
                <div
                  className="login-content left"
                  style={
                    ui.loginPlaceholderImage
                      ? { backgroundImage: `url(${ui.loginPlaceholderImage})` }
                      : null
                  }
                />
              </Col>
              <Col xs={24} sm={24} md={18} lg={12}>
                <div className="login-content right">
                  <div className="title">
                    {intl.formatMessage({
                      id: 'fanSignUp',
                      defaultMessage: 'Fan Sign Up'
                    })}
                  </div>
                  <p className="text-center">
                    <small>
                      {intl.formatMessage({
                        id: 'signUpToInteractWithYourIdols',
                        defaultMessage: 'Sign up to interact with your idols!'
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
                        id: 'signUpWithTwitterCase',
                        defaultMessage: 'SIGN UP WITH TWITTER'
                      })}
                    </button>
                    <GoogleLoginButton
                      clientId={settings.googleClientId}
                      onSuccess={this.onGoogleLogin.bind(this)}
                      onFailure={this.onGoogleLogin.bind(this)}
                    />
                    {/* <GoogleLogin
                      className="google-button"
                      clientId={settings.googleClientId}
                      buttonText="SIGN UP WITH GOOGLE"
                      onSuccess={this.onGoogleLogin.bind(this)}
                      onFailure={this.onGoogleLogin.bind(this)}
                      cookiePolicy="single_host_origin"
                    /> */}
                  </div>
                  <Divider>
                    {intl.formatMessage({
                      id: 'or',
                      defaultMessage: 'or'
                    })}
                  </Divider>
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
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'inputName',
                              defaultMessage: 'Please input your name!'
                            })}`
                          },
                          {
                            pattern: new RegExp(
                              /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
                            ),
                            message: `${intl.formatMessage({
                              id: 'firstNameCanNotContain',
                              defaultMessage:
                                'First name can not contain number and special character'
                            })}`
                          }
                        ]}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'firstName',
                            defaultMessage: 'First name'
                          })}
                        />
                      </Form.Item>
                      <Form.Item
                        name="lastName"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'inputName',
                              defaultMessage: 'Please input your name!'
                            })}`
                          },
                          {
                            pattern: new RegExp(
                              /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
                            ),
                            message: `${intl.formatMessage({
                              id: 'lastNameCanNotContain',
                              defaultMessage:
                                'Last name can not contain number and special character'
                            })}`
                          }
                        ]}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'lastName',
                            defaultMessage: 'Last name'
                          })}
                        />
                      </Form.Item>
                      <Form.Item
                        name="email"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            type: 'email',
                            message: `${intl.formatMessage({
                              id: 'invalidEmailAddress',
                              defaultMessage: 'Invalid email address!'
                            })}`
                          },
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'inputEmailAddress',
                              defaultMessage:
                                'Please input your email address!'
                            })}`
                          }
                        ]}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'emailAddress',
                            defaultMessage: 'Email address'
                          })}
                        />
                      </Form.Item>
                      <Form.Item
                        name="password"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            pattern: new RegExp(
                              /^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g
                            ),
                            message: `${intl.formatMessage({
                              id: 'passwordPattern',
                              defaultMessage:
                                'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                            })}`
                          },
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'inputPassword',
                              defaultMessage: 'Please enter your password!'
                            })}`
                          }
                        ]}
                      >
                        <Input.Password
                          placeholder={intl.formatMessage({
                            id: 'password',
                            defaultMessage: 'Password'
                          })}
                        />
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
                          {intl.formatMessage({
                            id: 'signUpCase',
                            defaultMessage: 'SIGN UP'
                          })}
                        </Button>
                        <p>
                          {intl.formatMessage({
                            id: 'bySigningUpYouAgreeToOur',
                            defaultMessage: 'By signing up you agree to our'
                          })}
                          {' '}
                          <a href="/page/terms-of-service" target="_blank">
                            {intl.formatMessage({
                              id: 'termsOfService',
                              defaultMessage: 'Terms of Service'
                            })}
                          </a>
                          {' '}
                          {intl.formatMessage({
                            id: 'and',
                            defaultMessage: 'and'
                          })}
                          {' '}
                          <a href="/page/privacy-policy" target="_blank">
                            {intl.formatMessage({
                              id: 'privacyPolicy',
                              defaultMessage: 'Privacy Policy'
                            })}
                          </a>
                          ,
                          {' '}
                          {intl.formatMessage({
                            id: 'andConfirmThatYouAreAtLeastEighteenYearsOld',
                            defaultMessage:
                              'and confirm that you are at least 18 years old.'
                          })}
                        </p>
                        <p>
                          {intl.formatMessage({
                            id: 'haveAccountAlready',
                            defaultMessage: 'Have an account already?'
                          })}
                          <Link href="/auth/login">
                            <a>
                              {' '}
                              {intl.formatMessage({
                                id: 'logInHere',
                                defaultMessage: 'Log in here.'
                              })}
                            </a>
                          </Link>
                        </p>
                        <p>
                          {intl.formatMessage({
                            id: 'areYouAModel',
                            defaultMessage: 'Are you a model?'
                          })}
                          <Link href="/auth/model-register">
                            <a>
                              {' '}
                              {intl.formatMessage({
                                id: 'signUpHere',
                                defaultMessage: 'Sign Up Here.'
                              })}
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

export default injectIntl(
  connect(mapStatesToProps, mapDispatchToProps)(FanRegister)
);
