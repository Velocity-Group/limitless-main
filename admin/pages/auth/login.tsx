import {
  Form, Input, Button, Row, Alert
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { login } from '@redux/auth/actions';
import { getResponseError } from '@lib/utils';
import './index.less';

const FormItem = Form.Item;

interface IProps {
  loginAuth: any;
  ui: any;
  login: Function;
}

export async function getStaticProps() {
  return {
    props: {}
  };
}
class Login extends PureComponent<IProps> {
  static layout: string = 'public';

  static authenticate: boolean = false;

  handleOk = (data) => {
    const { login: handlerLogin } = this.props;
    handlerLogin(data);
  };

  render() {
    const { ui } = this.props;
    const {
      loginAuth = { requesting: false, error: null, success: false }
    } = this.props;
    return (
      <>
        <Head>
          <title>Login</title>
        </Head>
        <div className="form">
          <div className="logo">
            {ui.logo ? <div><img alt="logo" src={ui && ui.logo} /></div> : ui.siteName}
            <div><span>Login</span></div>
          </div>
          {loginAuth.error && (
            <Alert
              message="Error"
              description={getResponseError(loginAuth.error)}
              type="error"
            />
          )}
          {loginAuth.success ? (
            <Alert
              message="Login success"
              type="success"
              description="Redirecting..."
            />
          ) : (
            <Form
              onFinish={this.handleOk}
              initialValues={{
                email: '',
                password: ''
              }}
            >
              <FormItem
                hasFeedback
                // label="Username"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email' }
                ]}
              >
                <Input
                  onPressEnter={this.handleOk}
                  placeholder="youremail@example.com"
                />
              </FormItem>
              <FormItem
                hasFeedback
                // label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' }
                ]}
              >
                <Input.Password
                  onPressEnter={this.handleOk}
                  placeholder="Password"
                />
              </FormItem>
              <Row>
                <Button
                  type="primary"
                  onClick={this.handleOk}
                  loading={loginAuth.requesting}
                  htmlType="submit"
                >
                  Sign in
                </Button>
              </Row>
            </Form>
          )}
        </div>
        <div className="footer" style={{ padding: '15px' }}>
          Copy right
          {' '}
          {new Date().getFullYear()}
        </div>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  loginAuth: state.auth.login,
  ui: state.ui
});
const mapDispatch = { login };
export default connect(mapStates, mapDispatch)(Login);
