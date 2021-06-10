import { Layout, Alert, Button } from 'antd';
import { PayCircleOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import { withRouter } from 'next/router';
import { IUser, IUIConfig } from '../../src/interfaces';

interface IProps {
  user: IUser;
  ui: IUIConfig;
  router: any;
}

class PaymentCancel extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static noredirect: boolean = true;

  render() {
    const { user, ui, router } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Payment Fail
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="Payment Fail" icon={<PayCircleOutlined />} />
          {router?.query?.transactionId && (
          <h4>
            <a>
              #
              {router?.query?.transactionId}
            </a>
          </h4>
          )}
          <Alert
            message="Payment fail"
            description={`Hi ${user?.name || user?.username || 'there'}, your payment has been fail! Please contact us for more information.`}
            type="error"
            showIcon
          />
          <h4 className="text-center"><Button type="link" onClick={() => window.history.back()}>Click here to back</Button></h4>
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
export default connect(mapStates, mapDispatch)(withRouter(PaymentCancel));
