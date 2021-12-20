/* eslint-disable react/no-did-update-set-state */
import { PureComponent } from 'react';
import {
  Form, Input, Button, Layout, Col, Row, message
} from 'antd';
import { authService } from '@services/index';
import Head from 'next/head';
import { IForgot } from 'src/interfaces';
import { connect } from 'react-redux';
import Link from 'next/link';
// import { GoogleReCaptcha } from '@components/common';
import './index.less';

interface IProps {
  auth: any;
  ui: any;
  forgot: Function;
  forgotData: any;
  query: any;
}

interface IState {
  submiting: boolean;
  countTime: number;
}

class Forgot extends PureComponent<IProps, IState> {
  static authenticate = false;

  static layout = 'blank';

  _intervalCountdown: any;

  recaptchaSuccess = false;

  state = {
    submiting: false,
    countTime: 60
  };

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    return { query };
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

  handleReset = async (data: IForgot) => {
    // const { ui } = this.props;
    // if (!this.recaptchaSuccess && ui.enableGoogleReCaptcha) {
    //   message.error('Are you a robot?');
    //   return;
    // }
    await this.setState({ submiting: true });
    try {
      await authService.resetPassword({
        ...data
      });
      message.success('An email has been sent to you to reset your password');
      this.handleCountdown();
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  };

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

  async handleVerifyCapcha(resp: any) {
    if (resp?.data?.success) {
      this.recaptchaSuccess = true;
    } else {
      this.recaptchaSuccess = false;
    }
  }

  coundown() {
    const { countTime } = this.state;
    this.setState({ countTime: countTime - 1 });
  }

  render() {
    const { ui } = this.props;
    const { submiting, countTime } = this.state;
    return (
      <>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            | Forgot Password
          </title>
        </Head>
        <Layout>
          <div className="main-container">
            <div className="login-box">
              <Row>
                <Col
                  xs={24}
                  sm={24}
                  md={6}
                  lg={12}
                  className="login-content left fixed"
                  style={ui.loginPlaceholderImage ? { backgroundImage: `url(${ui?.loginPlaceholderImage})` } : null}
                />
                <Col
                  xs={24}
                  sm={24}
                  md={18}
                  lg={12}
                  className="login-content right"
                  style={{ paddingTop: '80px' }}
                >
                  {ui.logo && <div className="login-logo"><a href="/"><img alt="logo" src={ui.logo} height="80px" /></a></div>}
                  <h3
                    style={{
                      fontSize: 30,
                      textAlign: 'center'
                    }}
                  >
                    Reset password
                  </h3>
                  <div>
                    <Form name="login-form" onFinish={this.handleReset.bind(this)}>
                      <Form.Item
                        hasFeedback
                        name="email"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            type: 'email',
                            message: 'Invalid email format'
                          },
                          {
                            required: true,
                            message: 'Please enter your E-mail!'
                          }
                        ]}
                      >
                        <Input placeholder="Enter your email address" />
                      </Form.Item>
                      {/* <GoogleReCaptcha ui={ui} handleVerify={this.handleVerifyCapcha.bind(this)} /> */}
                      <Form.Item style={{ textAlign: 'center' }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="login-form-button"
                          disabled={submiting || countTime < 60}
                          loading={submiting || countTime < 60}
                        >
                          {countTime < 60 ? 'Resend in' : 'Send'}
                          {' '}
                          {countTime < 60 && `${countTime}s`}
                        </Button>
                        <p>
                          Have an account already?
                          <Link href="/">
                            <a> Log in here.</a>
                          </Link>
                        </p>
                        <p>
                          Don&apos;t have an account yet?
                          <Link href="/auth/register">
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
        </Layout>
      </>
    );
  }
}

const mapStatetoProps = (state: any) => ({
  ui: { ...state.ui }
});

export default connect(mapStatetoProps)(Forgot);
