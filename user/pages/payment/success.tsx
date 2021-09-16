import { Layout, Alert, Button } from 'antd';
import { PureComponent } from 'react';
import { TransactionOutlined } from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { connect } from 'react-redux';
import Head from 'next/head';
import { withRouter } from 'next/router';
import { clearCart } from '@redux/cart/actions';
import { IUser, IUIConfig } from 'src/interfaces';

interface IProps {
  clearCart: Function;
  user: IUser;
  ui: IUIConfig;
  router: any
}

class PaymentSuccess extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static noredirect: boolean = true;

  componentDidMount() {
    const { clearCart: clearCartHandler } = this.props;
    setTimeout(() => { clearCartHandler(); }, 1000);
    localStorage.setItem('cart', JSON.stringify([]));
  }

  render() {
    const { ui, user, router } = this.props;
    return (
      <Layout>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            | Payment Success
          </title>
        </Head>
        <div className="main-container">
          <PageHeading title="Payment Success" icon={<TransactionOutlined />} />
          {router?.query?.transactionId && (
          <h4>
            <a>
              #
              {router?.query?.transactionId}
            </a>
          </h4>
          )}
          <Alert
            message="Payment success"
            description={`Hi ${user.name || user.username || 'there'}, your payment has been successfully!`}
            type="success"
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

const mapDispatch = { clearCart };
export default connect(mapStates, mapDispatch)(withRouter(PaymentSuccess));
