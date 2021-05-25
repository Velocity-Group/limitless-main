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
import { connect } from 'react-redux';
import { registerPerformer, loginSocial } from '@redux/auth/actions';
import { IUIConfig } from 'src/interfaces';
import { ImageUpload } from '@components/file';
import moment from 'moment';
import GoogleLogin from 'react-google-login';
import { authService } from '@services/auth.service';
import './index.less';

const { Option } = Select;

interface IProps {
  loginSocial: Function;
  registerPerformerData: any;
  registerPerformer: Function;
  ui: IUIConfig;
}

class RegisterPerformer extends PureComponent<IProps> {
  static layout = 'blank';

  static authenticate = false;

  idVerificationFile = null;

  documentVerificationFile = null;

  state = {
    selectedGender: 'male',
    isLoading: false
  };

  onFileReaded = (type, file: File) => {
    if (file && type === 'idFile') {
      this.idVerificationFile = file;
    }
    if (file && type === 'documentFile') {
      this.documentVerificationFile = file;
    }
  }

  async onGoogleLogin(resp: any) {
    if (!resp.tokenId) {
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
    const { registerPerformerData = { requesting: false }, ui } = this.props;
    const { selectedGender, isLoading } = this.state;

    const placeholderIdImg = () => {
      switch (selectedGender) {
        case 'male': return '/static/img-id-man.png';
        case 'female': return '/static/img-id-woman.png';
        case 'transgender': return '/static/img-id-man.png';
        case 'couple': return '/static/img-id-couple.png';
        default: return '/static/img-id-man.png';
      }
    };

    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Model Register
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box register-box">
            <div className="text-center">
              <span className="title">Model Register</span>
            </div>
            <p className="text-center"><small>Sign up to make money and interact with your fans!</small></p>
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
            <Form
              name="member_register"
              initialValues={{
                gender: 'male',
                country: 'US',
                dateOfBirth: ''
              }}
              onFinish={this.register}
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
                        hasFeedback
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
                        hasFeedback
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
                        hasFeedback
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
                        hasFeedback
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
                        hasFeedback
                        rules={[
                          {
                            required: true,
                            message: 'Select your date of birth'
                          }
                        ]}
                      >
                        <DatePicker
                          placeholder="Date of Birth"
                          disabledDate={(currentDate) => currentDate && currentDate > moment().subtract(14, 'year').endOf('day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="country" rules={[{ required: true }]} hasFeedback>
                        <Select
                          showSearch
                          filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        >
                          {ui.countries
                            && ui.countries.length > 0
                            && ui.countries.map((c) => (
                              <Option value={c.code} key={c.code}>
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
                        hasFeedback
                      >
                        <Select onChange={(val) => this.setState({ selectedGender: val })}>
                          <Option value="male" key="male">Male</Option>
                          <Option value="female" key="female">Female</Option>
                          {/* <Option value="couple" key="couple">Couple</Option> */}
                          <Option value="transgender" key="trans">Trans</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
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
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="confirm"
                        dependencies={['password']}
                        hasFeedback
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
                      help="Please upload proof of one of either of the following: social security number or national insurance number or passport or a different photographic id to your photo verification"
                    >
                      <div className="id-block">
                        <ImageUpload onFileReaded={this.onFileReaded.bind(this, 'idFile')} />
                        <img alt="identity-img" className="img-id" src="/static/id-document.png" />
                      </div>
                    </Form.Item>
                    <Form.Item
                      labelCol={{ span: 24 }}
                      name="documentVerificationId"
                      className="model-photo-verification"
                      help="Upload a photo of yourself holding your indentity document next to your face"
                    >
                      <div className="id-block">
                        <ImageUpload onFileReaded={this.onFileReaded.bind(this, 'documentFile')} />
                        <img alt="identity-img" className="img-id" src={placeholderIdImg()} />
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
                  style={{
                    marginBottom: 15,
                    fontWeight: 600,
                    padding: '5px 25px',
                    height: '42px'
                  }}
                >
                  CREATE YOUR ACCOUNT
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
                    <a> Login here.</a>
                  </Link>
                </p>
                <p>
                  Are you a fan?
                  <Link href="/auth/fan-register">
                    <a> Register here.</a>
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
  registerPerformerData: { ...state.auth.registerPerformerData }
});

const mapDispatchToProps = { registerPerformer, loginSocial };

export default connect(mapStatesToProps, mapDispatchToProps)(RegisterPerformer);
