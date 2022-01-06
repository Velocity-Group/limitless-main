import {
  Form, Input, Button, Row, Layout, message
} from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { login } from '@redux/auth/actions';
import Link from 'next/link';
import './index.less';
import { getGlobalConfig } from '@services/config';

const FormItem = Form.Item;

interface IProps {
  loginAuth: any;
  ui: any;
  login: Function;
}

class Login extends PureComponent<IProps> {
  static layout: string = 'public';

  static authenticate: boolean = false;

  async componentDidUpdate(preProps) {
    const { loginAuth } = this.props;
    const { error } = loginAuth;
    if (preProps?.loginAuth?.error !== error && error) {
      const e = await error;
      message.error(e?.message || 'Error occured, please try again', 5);
    }
  }

  handleOk = (data) => {
    const { login: handlerLogin } = this.props;
    handlerLogin(data);
  };

  render() {
    const { ui, login: handlerLogin } = this.props;
    const {
      loginAuth = { requesting: false, error: null, success: false }
    } = this.props;
    const config = getGlobalConfig();
    return (
      <Layout>
        <Head>
          <title>Log in</title>
        </Head>
        <div className="form-body">
          <div className="form">
            <div className="logo">
              {ui.logo ? <div><img alt="logo" src={ui && ui.logo} /></div> : ui.siteName}
              <h2>Admin Panel</h2>
            </div>
            <Form
              onFinish={(values) => handlerLogin(values)}
              initialValues={{
                username: '',
                password: ''
              }}
            >
              <FormItem
                hasFeedback
                name="username"
                rules={[
                  { required: true, message: 'Email or Username is missing' }
                ]}
              >
                <Input
                  placeholder="Email address or Username"
                />
              </FormItem>
              <FormItem
                hasFeedback
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' }
                ]}
              >
                <Input.Password
                  placeholder="Password"
                />
              </FormItem>
              <Row>
                <Button
                  type="primary"
                  loading={loginAuth.requesting}
                  disabled={loginAuth.requesting}
                  htmlType="submit"
                >
                  Log in
                </Button>
              </Row>
            </Form>
            <p>
              <Link href="/auth/forgot">
                <a>Forgot password?</a>
              </Link>
            </p>
          </div>
        </div>
        <div className="footer">
          Version
          {' '}
          {config.NEXT_PUBLIC_BUILD_VERSION}
          {' '}
          - Copy right
          {' '}
          {new Date().getFullYear()}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  loginAuth: state.auth.login,
  ui: state.ui
});
const mapDispatch = { login };
export default connect(mapStates, mapDispatch)(Login);
