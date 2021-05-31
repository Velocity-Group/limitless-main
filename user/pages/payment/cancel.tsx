import { Layout, Alert, Button } from 'antd';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Router from 'next/router';
import Head from 'next/head';
import { IUser, IUIConfig } from '../../src/interfaces';

interface IProps {
  user: IUser;
  ui: IUIConfig
}

class PaymentCancel extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static noredirect: boolean = true;

  render() {
    const { user, ui } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Payment canceled
          </title>
        </Head>
        <div className="main-container">
          <div className="page-heading">Payment Canceled</div>
          <Alert
            message="Payment canceled"
            description={`Hi ${user?.name || user?.username || 'there'}, your payment has been canceled! Please contact us for more information.`}
            type="error"
            showIcon
          />
          <h4 className="text-center"><Button type="link" onClick={() => Router.back()}>Click here to back</Button></h4>
        </div>
      </Layout>
    );
  }
}

const mapStates = (state: any) => ({
  user: state.user.current,
  ui: { ...state.ui }
});

const mapDispatch = {};
export default connect(mapStates, mapDispatch)(PaymentCancel);
