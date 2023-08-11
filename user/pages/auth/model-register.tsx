/* eslint-disable prefer-promise-reject-errors */
import {
  Row, Col, Button, Layout, Form, Input, Select, message, DatePicker, Divider
} from 'antd';
import { TwitterOutlined } from '@ant-design/icons';
import { PureComponent } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Router from 'next/router';
import { connect } from 'react-redux';
import { registerPerformer, loginSocial, loginSuccess } from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { ISettings, IUIConfig, ICountry } from 'src/interfaces';
import moment from 'moment';
import { authService, userService, utilsService } from 'src/services';
import GoogleLoginButton from '@components/auth/google-login-button';
import { injectIntl, IntlShape } from 'react-intl';
// import ImageUploadModel from '@components/file/image-upload-model';

import './index.less';

const { Option } = Select;

interface IProps {
  loginSocial: Function;
  registerPerformerData: any;
  registerPerformer: Function;
  updateCurrentUser: Function;
  loginSuccess: Function;
  ui: IUIConfig;
  settings: ISettings;
  countries: ICountry[];
  intl: IntlShape;
  rel: string;
}

class RegisterPerformer extends PureComponent<IProps> {
  static layout = 'blank';

  static authenticate = false;

  idVerificationFile = null;

  documentVerificationFile = null;

  static async getInitialProps({ ctx }) {
    const [countries] = await Promise.all([utilsService.countriesList()]);
    return {
      countries: countries?.data || [],
      rel: ctx?.query?.rel
    };
  }

  state = {
    isLoading: false
  };

  async componentDidMount() {
    this.redirectLogin();
  }

  componentDidUpdate(prevProps) {
    const { registerPerformerData, ui, intl } = this.props;
    if (
      !prevProps?.registerPerformerData?.success
      && prevProps?.registerPerformerData?.success !== registerPerformerData?.success
    ) {
      message.success(
        <div>
          <h4>
            {`${intl.formatMessage({
              id: 'thankYouForApplyingToBeAn',
              defaultMessage: 'Thank you for applying to be an'
            })} ${ui?.siteName || 'Fanso'} ${intl.formatMessage({
              id: 'creator',
              defaultMessage: 'creator'
            })}!`}

          </h4>
          <p>
            {registerPerformerData?.data?.message
              || `${intl.formatMessage({
                id: 'notificationOfSuccessfulApplicationSubmissionModel',
                defaultMessage:
                  'Your application will be processed withing 24 to 48 hours, most times sooner. You will get an email notification sent to your email address with the status update.'
              })}`}
          </p>
        </div>,
        15
      );
      Router.push('/auth/login');
    }
  }

  onGoogleLogin = async (resp: any) => {
    if (!resp?.credential) {
      return;
    }
    const { loginSocial: handleLogin, intl } = this.props;
    const payload = { tokenId: resp.credential, role: 'performer' };
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

  register = async (values: any) => {
    const { registerPerformer: registerPerformerHandler } = this.props;
    return registerPerformerHandler(values);
  };

  loginTwitter = async () => {
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
          'performer'
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

  render() {
    const {
      registerPerformerData = { requesting: false },
      ui,
      settings,
      countries,
      intl,
      rel
    } = this.props;
    const { isLoading } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'modelSignUp',
              defaultMessage: 'Model Sign Up'
            })}
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box register-box">
            <div className="text-center">
              <span className="title">
                {intl.formatMessage({
                  id: 'modelSignUp',
                  defaultMessage: 'Model Sign Up'
                })}
              </span>
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
              {intl.formatMessage({ id: 'or', defaultMessage: 'or' })}
            </Divider>
            <Form
              name="member_register"
              initialValues={{
                gender: 'male',
                country: 'US',
                dateOfBirth: '',
                rel
              }}
              onFinish={this.register}
              scrollToFirstError
            >
              <Row justify="center">
                <Col xs={24} sm={24} md={14} lg={14}>
                  <Row>
                    <Col span={12}>
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
                    </Col>
                    <Col span={12}>
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
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="name"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: 'Please input your display name!'
                          },
                          {
                            pattern: new RegExp(/^(?=.*\S).+$/g),
                            message: `${intl.formatMessage({
                              id: 'displayNameCannotContain',
                              defaultMessage:
                                'Display name can not contain only whitespace'
                            })}`
                          },
                          {
                            min: 3,
                            message: `${intl.formatMessage({
                              id: 'displayNameContainAtLeastThreeCharacters',
                              defaultMessage:
                                'Display name must containt at least 3 characters'
                            })}`
                          }
                        ]}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'displayName',
                            defaultMessage: 'Display name'
                          })}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'pleaseInputYourUsername',
                              defaultMessage: 'Please input your username!'
                            })}`
                          },
                          {
                            pattern: new RegExp(/^[a-z0-9]+$/g),
                            message: `${intl.formatMessage({
                              id: 'usernameMustContainOnlyLowercaseAlphanumericsOnly',
                              defaultMessage:
                                'Username must contain only lowercase alphanumerics only!'
                            })}`
                          },
                          {
                            min: 3,
                            message:
                              intl.formatMessage({
                                id: 'usernameMustContaintAtLeast3Characters',
                                defaultMessage: 'Username must containt at least 3 characters'
                              })
                          }
                        ]}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'username',
                            defaultMessage: 'Username'
                          })}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        validateTrigger={['onChange', 'onBlur']}
                        hasFeedback
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
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="dateOfBirth"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'selectDateOfBirth',
                              defaultMessage: 'Select your date of birth!'
                            })}`
                          }
                        ]}
                      >
                        <DatePicker
                          placeholder={intl.formatMessage({
                            id: 'dateOfBirth',
                            defaultMessage: 'Date of Birth'
                          })}
                          disabledDate={(currentDate) => currentDate
                            && currentDate
                              > moment().subtract(18, 'year').endOf('day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="country" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="label">
                          {countries.map((c) => (
                            <Option value={c.code} key={c.code} label={c.name}>
                              <img
                                alt="country_flag"
                                src={c.flag}
                                width="25px"
                              />
                              {' '}
                              {intl.formatMessage({ id: c.code, defaultMessage: c.name })}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="gender"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: 'Please select your gender'
                          }
                        ]}
                      >
                        <Select>
                          <Option value="male" key="male">
                            {intl.formatMessage({
                              id: 'male',
                              defaultMessage: 'Male'
                            })}
                          </Option>
                          <Option value="female" key="female">
                            {intl.formatMessage({
                              id: 'female',
                              defaultMessage: 'Female'
                            })}
                          </Option>
                          <Option value="transgender" key="trans">
                            {intl.formatMessage({
                              id: 'transgender',
                              defaultMessage: 'Transgender'
                            })}
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
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
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="confirm"
                        dependencies={['password']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: `${intl.formatMessage({
                              id: 'inputPasswordConfirm',
                              defaultMessage: 'Please enter confirm password!'
                            })}`
                          },
                          ({ getFieldValue }) => ({
                            validator(rule, value) {
                              if (
                                !value
                                || getFieldValue('password') === value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                intl.formatMessage({
                                  id: 'passwordsDoNotMatchTogether',
                                  defaultMessage:
                                    'Passwords do not match together!'
                                })
                              );
                            }
                          })
                        ]}
                      >
                        <Input
                          type="password"
                          placeholder={intl.formatMessage({
                            id: 'passwordConfirm',
                            defaultMessage: 'Confirm password'
                          })}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="rel"
                        validateTrigger={['onChange', 'onBlur']}
                        label={intl.formatMessage({ id: 'referralCode', defaultMessage: 'Referral Code' })}
                      >
                        <Input placeholder={intl.formatMessage({ id: 'referralCode', defaultMessage: 'Referral Code' })} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                {/* <Col xs={24} sm={24} md={10} lg={10}>
                  <div className="register-form">
                    <Form.Item
                      labelCol={{ span: 24 }}
                      name="idVerificationId"
                      className="model-photo-verification"
                      help={intl.formatMessage({
                        id: 'idCardUpload',
                        defaultMessage:
                          'Your government issued ID card, National ID card, Passport or Driving license'
                      })}
                    >
                      <div className="id-block">
                        <ImageUploadModel
                          onFileReaded={(f) => this.onFileReaded(f, 'idFile')}
                        />
                        <img
                          alt="id-img"
                          className="img-id"
                          src="/static/front-id.png"
                        />
                      </div>
                    </Form.Item>
                    <Form.Item
                      labelCol={{ span: 24 }}
                      name="documentVerificationId"
                      className="model-photo-verification"
                      help={intl.formatMessage({
                        id: 'selfieImageUpload',
                        defaultMessage:
                          'Your selfie with your ID and handwritten note'
                      })}
                    >
                      <div className="id-block">
                        <ImageUploadModel
                          onFileReaded={(f) => this.onFileReaded(f, 'documentFile')}
                        />
                        <img
                          alt="holdinh-img"
                          className="img-id"
                          src="/static/holding-id.jpg"
                        />
                      </div>
                    </Form.Item>
                  </div>
                </Col> */}
              </Row>
              <Form.Item style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={registerPerformerData.requesting || isLoading}
                  loading={registerPerformerData.requesting || isLoading}
                  className="login-form-button"
                  style={{ maxWidth: 300 }}
                >
                  {intl.formatMessage({
                    id: 'createYourAccountCase',
                    defaultMessage: 'CREATE YOUR ACCOUNT'
                  })}
                </Button>
                <p>
                  {intl.formatMessage({
                    id: 'bySigningUpYouAgreeToOur',
                    defaultMessage: 'By signing up you agree to our'
                  })}
                  {' '}
                  <a href="/page/term-of-service" target="_blank">
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
                    id: 'areYouAFan',
                    defaultMessage: 'Are you a fan?'
                  })}
                  <Link href="/auth/fan-register">
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
      </Layout>
    );
  }
}

const mapStatesToProps = (state: any) => ({
  ui: { ...state.ui },
  settings: { ...state.settings },
  registerPerformerData: { ...state.auth.registerPerformerData }
});

const mapDispatchToProps = {
  registerPerformer, loginSocial, loginSuccess, updateCurrentUser
};

export default injectIntl(
  connect(mapStatesToProps, mapDispatchToProps)(RegisterPerformer)
);
