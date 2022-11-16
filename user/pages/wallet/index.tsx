import Head from 'next/head';
import {
  Layout, message, InputNumber, Form, Input, Button
} from 'antd';
import {
  ArrowLeftOutlined
} from '@ant-design/icons';
import { WalletSvg } from 'src/icons';
import { PureComponent } from 'react';
import { paymentService } from '@services/index';
import {
  IUIConfig, IUser, ISettings
} from '@interfaces/index';
import { connect } from 'react-redux';
import Router from 'next/router';
import Loader from '@components/common/base/loader';
import './index.less';

interface IProps {
  ui: IUIConfig;
  user: IUser;
  settings: ISettings
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

class TokenPackages extends PureComponent<IProps> {
  static authenticate = true;

  state = {
    submiting: false,
    couponCode: '',
    coupon: null,
    amount: 10
  };

  addFund = async ({ amount }) => {
    const { user, settings } = this.props;
    const {
      couponCode, coupon
    } = this.state;
    if (settings.paymentGateway === 'stripe' && !user?.stripeCardIds?.length) {
      message.error('Please add a payment card to complete your purchase');
      Router.push('/user/cards');
      return;
    }
    try {
      this.setState({ submiting: true });
      const resp = await paymentService.addFunds({
        paymentGateway: settings.paymentGateway,
        amount,
        couponCode: coupon ? couponCode : ''
      });
      if (settings.paymentGateway === 'ccbill') {
        window.location.href = resp?.data?.paymentUrl;
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ submiting: false });
    }
  }

  applyCoupon = async () => {
    const { couponCode } = this.state;
    if (!couponCode) return;
    try {
      const resp = await paymentService.applyCoupon(couponCode);
      this.setState({ coupon: resp.data });
      message.success('Coupon is applied');
    } catch (error) {
      const e = await error;
      message.error(e?.message || 'Error occured, please try again later');
    }
  }

  render() {
    const { ui, user } = this.props;
    const {
      submiting, couponCode, coupon, amount
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            | Wallet
          </title>
        </Head>
        <div className="main-container">
          <div className="page-heading" style={{ justifyContent: 'flex-start' }}>
            <span aria-hidden onClick={() => Router.back()}>
              <ArrowLeftOutlined />
              {' '}
              Wallet
            </span>
          </div>
          <div className="purchase-form">
            <div className="current-balance">
              <WalletSvg />
              <div className="balance">
                <b>Current Balance</b>
                <span className="amount">
                  $
                  {(user.balance || 0).toFixed(2)}
                </span>
              </div>
            </div>
            <Form
              onFinish={this.addFund}
              onFinishFailed={() => message.error('Please complete the required fields')}
              name="form-upload"
              scrollToFirstError
              initialValues={{
                amount: 10
              }}
              {...layout}
            >
              <Form.Item
                name="amount"
                label="Enter Amount"
                rules={[{ required: true, message: 'Amount is required!' }]}
              >
                <InputNumber onChange={(val) => this.setState({ amount: val })} style={{ width: '100%' }} min={1} />
              </Form.Item>
              <Form.Item help={coupon && (
              <small style={{ color: 'red' }}>
                Discount
                {' '}
                {coupon.value * 100}
                %
              </small>
              )}
              >
                <Button.Group className="coupon-dc">
                  <Input disabled={!!coupon} placeholder="Enter coupon code here" onChange={(e) => this.setState({ couponCode: e.target.value })} />
                  {!coupon ? <Button disabled={!couponCode} onClick={this.applyCoupon.bind(this)}>Apply!</Button>
                    : <Button type="primary" onClick={() => this.setState({ couponCode: '', coupon: null })}>Use Later!</Button>}

                </Button.Group>
              </Form.Item>
              <Form.Item className="total-price">
                Total:
                <span className="amount">
                  $
                  {(amount - (amount * (coupon?.value || 0))).toFixed(2)}
                </span>
              </Form.Item>
              <Form.Item className="text-center">
                <Button htmlType="submit" className="primary" disabled={submiting} loading={submiting}>
                  BUY NOW
                </Button>
              </Form.Item>
            </Form>
          </div>
          {submiting && <Loader customText="We are processing your payment, please do not reload this page until it's done." />}
        </div>
      </Layout>
    );
  }
}

const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  settings: { ...state.settings }
});

export default connect(mapStates)(TokenPackages);
