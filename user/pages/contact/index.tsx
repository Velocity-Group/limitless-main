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

const { TextArea } = Input;

interface IProps {
  ui: IUIConfig;
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
  }

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
  }

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
    try {
      await this.setState({ submiting: true });
      await settingService.contact(values);
      message.success('Thank you for contact us, we will reply within 48hrs.');
      this.handleCountdown();
    } catch (e) {
      message.error('Error occured, please try again later');
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
    const { ui } = this.props;
    const { submiting, countTime } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {' '}
            {ui?.siteName}
            {' '}
            | Contact Us
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
                style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui.loginPlaceholderImage})` } : null}
              />
              <Col
                xs={24}
                sm={24}
                md={12}
                lg={12}
                className="login-content right"
              >
                <p className="text-center">
                  <span className="title">Contact Us</span>
                </p>
                <h5
                  className="text-center"
                  style={{ fontSize: 13, color: '#888' }}
                >
                  Please fill out the form below and we will get back to you as soon as possible
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
                    rules={[{ required: true, message: 'Tell us your full name' }]}
                  >
                    <Input placeholder="Full name" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: 'Tell us your email address.'
                      },
                      { type: 'email', message: 'Invalid email format' }
                    ]}
                  >
                    <Input placeholder="Email address" />
                  </Form.Item>
                  <Form.Item
                    name="message"
                    rules={[
                      { required: true, message: 'What can we help you?' },
                      {
                        min: 20,
                        message: 'Please input at least 20 characters.'
                      }
                    ]}
                  >
                    <TextArea rows={3} placeholder="Message" />
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
                      style={{ fontWeight: 600, width: '100%' }}
                    >
                      {countTime < 60 ? 'RESEND IN' : 'SEND'}
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
export default connect(mapStates)(ContactPage);
