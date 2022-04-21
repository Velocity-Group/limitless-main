/* eslint-disable prefer-promise-reject-errors */
import {
  Row,
  Col,
  Button,
  Layout,
  Form,
  Input,
  Select,
  message,
  DatePicker,
  Divider
} from 'antd';
import { TwitterOutlined } from '@ant-design/icons';
import { PureComponent } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Router from 'next/router';
import { connect } from 'react-redux';
import { registerPerformer, loginSocial } from '@redux/auth/actions';
import { ISettings, IUIConfig, ICountry } from 'src/interfaces';
import { ImageUpload } from '@components/file';
import moment from 'moment';
import GoogleLogin from 'react-google-login';
import { authService, utilsService } from 'src/services';
import './index.less';

const { Option } = Select;

interface IProps {
  loginSocial: Function;
  registerPerformerData: any;
  registerPerformer: Function;
  ui: IUIConfig;
  settings: ISettings;
  countries: ICountry[]
}

class RegisterPerformer extends PureComponent<IProps> {
  static layout = 'blank';

  static authenticate = false;

  idVerificationFile = null;

  documentVerificationFile = null;

  static async getInitialProps() {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return {
      countries: countries?.data || []
    };
  }

  state = {
    isLoading: false
  };

  componentDidUpdate(prevProps) {
    const { registerPerformerData, ui } = this.props;
    if (!prevProps?.registerPerformerData?.success && prevProps?.registerPerformerData?.success !== registerPerformerData?.success) {
      message.success(
        <div>
          <h4>{`Thank you for applying to be an ${ui?.siteName || 'Fanso'} creator!`}</h4>
          <p>{registerPerformerData?.data?.message || 'Your application will be processed withing 24 to 48 hours, most times sooner. You will get an email notification sent to your email address with the status update.'}</p>
        </div>,
        15
      );
      Router.push('/');
    }
  }

  onFileReaded = (type, file: File) => {
    if (file && type === 'idFile') {
      this.idVerificationFile = file;
    }
    if (file && type === 'documentFile') {
      this.documentVerificationFile = file;
    }
  }

  async onGoogleLogin(resp: any) {
    if (!resp?.tokenId) {
      return;
    }
    const { loginSocial: handleLogin } = this.props;
    const payload = { tokenId: resp.tokenId, role: 'performer' };
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

  register = (values: any) => {
    const data = values;
    const { registerPerformer: registerPerformerHandler } = this.props;
    if (!this.idVerificationFile || !this.documentVerificationFile) {
      return message.error('ID documents are required!');
    }
    data.idVerificationFile = this.idVerificationFile;
    data.documentVerificationFile = this.documentVerificationFile;
    return registerPerformerHandler(data);
  };

  async loginTwitter() {
    try {
      await this.setState({ isLoading: true });
      const resp = await (await authService.loginTwitter()).data;
      if (resp && resp.url) {
        authService.setTwitterToken({ oauthToken: resp.oauthToken, oauthTokenSecret: resp.oauthTokenSecret }, 'performer');
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
      registerPerformerData = { requesting: false }, ui, settings, countries
    } = this.props;
    const { isLoading } = this.state;

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Model Sign Up
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box register-box">
            <div className="text-center">
              <span className="title">Model Sign Up</span>
            </div>
            <p className="text-center"><small>Sign up to make money and interact with your fans!</small></p>
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
            <Form
              name="member_register"
              initialValues={{
                gender: 'male',
                country: 'US',
                dateOfBirth: ''
              }}
              onFinish={this.register}
              scrollToFirstError
            >
              <Row>
                <Col
                  xs={24}
                  sm={24}
                  md={14}
                  lg={14}
                >
                  <Row>
                    <Col span={12}>
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
                    </Col>
                    <Col span={12}>
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
                    </Col>
                    <Col span={12}>
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
                      >
                        <Input placeholder="Display name" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          { required: true, message: 'Please input your username!' },
                          {
                            pattern: new RegExp(/^[a-z0-9]+$/g),
                            message:
                              'Username must contain only lowercase alphanumerics only!'
                          },
                          { min: 3, message: 'username must containt at least 3 characters' }
                        ]}
                      >
                        <Input placeholder="Username" />
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
                            message: 'The input is not valid E-mail!'
                          },
                          {
                            required: true,
                            message: 'Please input your E-mail!'
                          }
                        ]}
                      >
                        <Input placeholder="Email address" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="dateOfBirth"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            message: 'Select your date of birth'
                          }
                        ]}
                      >
                        <DatePicker
                          placeholder="Date of Birth"
                          disabledDate={(currentDate) => currentDate && currentDate > moment().subtract(18, 'year').endOf('day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="country" rules={[{ required: true }]}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                        >
                          {countries.map((c) => (
                            <Option value={c.code} key={c.code} label={c.name}>
                              <img alt="country_flag" src={c.flag} width="25px" />
                              {' '}
                              {c.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="gender"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[{ required: true, message: 'Please select your gender' }]}
                      >
                        <Select>
                          <Option value="male" key="male">Male</Option>
                          <Option value="female" key="female">Female</Option>
                          <Option value="transgender" key="trans">Trans</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="password"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            pattern: new RegExp(/^(?=.{8,})(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])(?=.*[^\w\d]).*$/g),
                            message: 'Password must have minimum 8 characters, at least 1 number, 1 uppercase letter, 1 lowercase letter & 1 special character'
                          },
                          { required: true, message: 'Please input your password!' }
                        ]}
                      >
                        <Input.Password placeholder="Password" />
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
                            message: 'Please enter confirm password!'
                          },
                          ({ getFieldValue }) => ({
                            validator(rule, value) {
                              if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject('Passwords do not match together!');
                            }
                          })
                        ]}
                      >
                        <Input type="password" placeholder="Confirm password" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col
                  xs={24}
                  sm={24}
                  md={10}
                  lg={10}
                >
                  <div className="register-form">
                    <Form.Item
                      labelCol={{ span: 24 }}
                      name="idVerificationId"
                      className="model-photo-verification"
                      help="Your government issued ID card, National ID card, Passport or Driving license"
                    >
                      <div className="id-block">
                        <ImageUpload onFileReaded={this.onFileReaded.bind(this, 'idFile')} uploadImmediately={false} />
                        <img alt="id-img" className="img-id" src="/static/front-id.png" />
                      </div>
                    </Form.Item>
                    <Form.Item
                      labelCol={{ span: 24 }}
                      name="documentVerificationId"
                      className="model-photo-verification"
                      help="Your selfie with your ID and handwritten note"
                    >
                      <div className="id-block">
                        <ImageUpload onFileReaded={this.onFileReaded.bind(this, 'documentFile')} uploadImmediately={false} />
                        <img alt="holdinh-img" className="img-id" src="/static/holding-id.jpg" />
                      </div>
                    </Form.Item>
                  </div>
                </Col>
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
                  CREATE YOUR ACCOUNT
                </Button>
                <p>
                  By signing up you agree to our
                  {' '}
                  <a href="/page/term-of-service" target="_blank">Terms of Service</a>
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
                  Are you a fan?
                  <Link href="/auth/fan-register">
                    <a> Sign up here.</a>
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

const mapDispatchToProps = { registerPerformer, loginSocial };

export default connect(mapStatesToProps, mapDispatchToProps)(RegisterPerformer);
