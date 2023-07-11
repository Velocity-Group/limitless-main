/* eslint-disable react/no-did-update-set-state */
import { PureComponent, createRef } from 'react';

import {
  Form, Button, Layout, Input, message, Col, Row
} from 'antd';
import Head from 'next/head';
import { settingService } from '@services/setting.service';
import { connect } from 'react-redux';
// import { GoogleReCaptcha } from '@components/common';
import { IUIConfig } from 'src/interfaces';
import '../auth/index.less';
import { injectIntl, IntlShape } from 'react-intl';

const { TextArea } = Input;

interface IProps {
  ui: IUIConfig;
  intl: IntlShape;
}

class ContactPage extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  _intervalCountdown: any;

  formRef: any;

  recaptchaSuccess = false;

  state = {
    submiting: false,
    countTime: 60
  };

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.countTime === 0) {
      this._intervalCountdown && clearInterval(this._intervalCountdown);
      this.setState({ countTime: 60 });
    }
  }

  componentWillUnmount() {
    this._intervalCountdown && clearInterval(this._intervalCountdown);
  }

  handleCountdown = async () => {
    const { countTime } = this.state;
    if (countTime === 0) {
      clearInterval(this._intervalCountdown);
      this.setState({ countTime: 60 });
      return;
    }
    this.setState({ countTime: countTime - 1 });
    this._intervalCountdown = setInterval(this.coundown.bind(this), 1000);
  };

  handleVerifyCapcha(resp: any) {
    if (resp?.data?.success) {
      this.recaptchaSuccess = true;
    } else {
      this.recaptchaSuccess = false;
    }
  }

  async onFinish(values) {
    // const { ui } = this.props;
    // if (!this.recaptchaSuccess && ui.enableGoogleReCaptcha) {
    //   message.error('Are you a robot?', 10);
    //   return;
    // }
    const { intl } = this.props;
    try {
      await this.setState({ submiting: true });
      await settingService.contact(values);
      message.success(
        intl.formatMessage({
          id: 'mssgThankYouWhenSendingContactSuccessfully',
          defaultMessage:
            'Thank you for contact us, we will reply within 48hrs.'
        })
      );
      this.handleCountdown();
    } catch (e) {
      message.error(
        intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
    } finally {
      this.formRef.current.resetFields();
      this.setState({ submiting: false });
    }
  }

  coundown() {
    const { countTime } = this.state;
    this.setState({ countTime: countTime - 1 });
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { ui, intl } = this.props;
    const { submiting, countTime } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui?.siteName}
            {' '}
            |
            {' '}
            {intl.formatMessage({
              id: 'contactUs',
              defaultMessage: 'Contact Us'
            })}
          </title>
        </Head>
        <div className="main-container">
          <div className="login-box">
            <Row>
              <Col
                xs={24}
                sm={24}
                md={12}
                lg={12}
                className="login-content left fixed"
                style={
                  ui.loginPlaceholderImage
                    ? { backgroundImage: `url(${ui.loginPlaceholderImage})` }
                    : null
                }
              />
              <Col
                xs={24}
                sm={24}
                md={12}
                lg={12}
                className="login-content right"
              >
                <p className="text-center">
                  <span className="title">
                    {intl.formatMessage({
                      id: 'contactUs',
                      defaultMessage: 'Contact Us'
                    })}
                  </span>
                </p>
                <h5
                  className="text-center"
                  style={{ fontSize: 13, color: '#888' }}
                >
                  {intl.formatMessage({
                    id: 'pleaseFillOutTheFormBelow',
                    defaultMessage:
                      'Please fill out the form below and we will get back to you as soon as possible'
                  })}
                </h5>
                <Form
                  layout="vertical"
                  name="contact-from"
                  ref={this.formRef}
                  onFinish={this.onFinish.bind(this)}
                  scrollToFirstError
                >
                  <Form.Item
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: `${intl.formatMessage({
                          id: 'tellUsYourFullName',
                          defaultMessage: 'Tell us your full name'
                        })}`
                      }
                    ]}
                  >
                    <Input
                      placeholder={intl.formatMessage({
                        id: 'fullName',
                        defaultMessage: 'Full name'
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: `${intl.formatMessage({
                          id: 'tellUsYourEmailAddress',
                          defaultMessage: 'Tell us your email address'
                        })}`
                      },
                      {
                        type: 'email',
                        message: `${intl.formatMessage({
                          id: 'invalidEmailFormat',
                          defaultMessage: 'Invalid email format!'
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
                    name="message"
                    rules={[
                      {
                        required: true,
                        message: `${intl.formatMessage({
                          id: 'whatCanWeHelpYou',
                          defaultMessage: 'What can we help you?'
                        })}`
                      },
                      {
                        min: 20,
                        message: `${intl.formatMessage({
                          id: 'inputAtLeast20Characters',
                          defaultMessage:
                            'Please input at least 20 characters.'
                        })}`
                      }
                    ]}
                  >
                    <TextArea
                      rows={3}
                      placeholder={intl.formatMessage({
                        id: 'message',
                        defaultMessage: 'Message'
                      })}
                    />
                  </Form.Item>
                  {/* <GoogleReCaptcha ui={ui} handleVerify={this.handleVerifyCapcha.bind(this)} /> */}
                  <div className="text-center">
                    <Button
                      size="large"
                      className="primary"
                      type="primary"
                      htmlType="submit"
                      loading={submiting || countTime < 60}
                      disabled={submiting || countTime < 60}
                      style={{
                        fontWeight: 600,
                        width: '100%',
                        textTransform: 'uppercase'
                      }}
                    >
                      {countTime < 60
                        ? `${intl.formatMessage({
                          id: 'resendIn',
                          defaultMessage: 'Resend in'
                        })}`
                        : `${intl.formatMessage({
                          id: 'send',
                          defaultMessage: 'Send'
                        })}`}
                      {' '}
                      {countTime < 60 && `${countTime}s`}
                    </Button>
                  </div>
                </Form>
              </Col>
            </Row>
          </div>
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
export default injectIntl(connect(mapStates)(ContactPage));
