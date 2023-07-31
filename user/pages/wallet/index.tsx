import Head from 'next/head';
import {
  Layout, message, InputNumber, Form, Input, Button, Alert, Modal, Tabs
} from 'antd';
import {
  ArrowLeftOutlined
} from '@ant-design/icons';
import { WalletSvg } from 'src/icons';
import { useEffect, useState } from 'react';
import { paymentService } from '@services/index';
import {
  IUIConfig, IUser, ISettings
} from '@interfaces/index';
import { connect } from 'react-redux';
import Router from 'next/router';
import Loader from '@components/common/base/loader';
import {
  useStripe
} from '@stripe/react-stripe-js';
import './index.less';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  ui: IUIConfig;
  user: IUser;
  settings: ISettings;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

function TokenPackages({ ui, user, settings }: IProps) {
  const [submiting, setSubmiting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [amount, setAmount] = useState(10);
  const [paymentGateway, setPaymentGateway] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stripe = useStripe();
  const intl: IntlShape = useIntl();

  useEffect(() => {
    let paymentMethod;
    if (settings?.coinbaseEnable) {
      paymentMethod = 'coinbase';
    } else if (settings?.ccbillEnable) {
      paymentMethod = 'ccbill';
    } else if (settings?.stripeEnable) {
      paymentMethod = 'stripe';
    }
    setPaymentGateway(paymentMethod);
  }, []);

  const addFund = async () => {
    if ((paymentGateway === 'ccbill' && amount < 2.95) || (paymentGateway === 'ccbill' && amount > 300)) {
      message.error(intl.formatMessage({ id: 'minimumAmountMustBe$2.95AndMaximumAmountMustBe300', defaultMessage: 'Minimum amount must be $2.95 and maximum amount must be 300' }));
      return;
    }
    if (paymentGateway === 'stripe' && !user?.stripeCardIds?.length) {
      message.error(intl.formatMessage({ id: 'pleaseAddAPaymentCardToCompleteYourPurchase', defaultMessage: 'Please add a payment card to complete your purchase' }));
      Router.push('/user/cards');
      return;
    }
    try {
      setSubmiting(true);
      const resp = await paymentService.addFunds({
        paymentGateway,
        amount,
        couponCode: coupon ? couponCode : ''
      });
      // to confirm 3D secure
      if (paymentGateway === 'stripe') {
        resp?.data?.stripeClientSecret && stripe.confirmCardPayment(resp?.data?.stripeClientSecret);
      }
      // coinbase
      if (['coinbase', 'ccbill'].includes(paymentGateway)) {
        window.location.href = resp?.data?.paymentUrl;
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
      setSubmiting(false);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const resp = await paymentService.applyCoupon(code);
      setCoupon(resp.data);
      message.success(intl.formatMessage({ id: 'couponApplied', defaultMessage: 'Coupon is applied' }));
    } catch (error) {
      const e = await error;
      message.error(e?.message || intl.formatMessage({ id: 'errorOccurredPleaseTryAgainLater', defaultMessage: 'Error occurred, please try again later' }));
    }
  };

  return (
    <Layout>
      <Head>
        <title>
          {ui?.siteName}
          {' '}
          |
          {' '}
          {intl.formatMessage({ id: 'wallet', defaultMessage: 'Wallet' })}
        </title>
      </Head>
      <div className="main-container">
        <div className="page-heading" style={{ justifyContent: 'flex-start' }}>
          <span aria-hidden onClick={() => Router.back()}>
            <ArrowLeftOutlined />
            {' '}
            {intl.formatMessage({ id: 'wallet', defaultMessage: 'Wallet' })}
          </span>
        </div>
        <div className="purchase-form">
          <div className="current-balance">
            <WalletSvg />
            <div className="balance">
              <b>{intl.formatMessage({ id: 'currentBalance', defaultMessage: 'Current Balance' })}</b>
              <span className="amount">
                $
                {(user.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>
          <Alert type="warning" style={{ width: '100%', margin: '10px 0' }} message={intl.formatMessage({ id: 'walletBalancesCanBeUsedAsAConvenientMethodToSendTipsToYourFavoritePerformersAsWellAsDigitalContentOnceYourWalletBalanceDepletesYouCanSimplyTopOffYourWalletAccountToContinueEnjoyingTheBenefits', defaultMessage: 'Wallet Balances can be used as a convenient method to send tips to your favorite performers as well as digital content. Once your wallet balance depletes you can simply top off your wallet account to continue enjoying the benefits.' })} />
          <Form
            onFinish={addFund}
            onFinishFailed={() => message.error(intl.formatMessage({ id: 'pleaseCompleteTheRequiredFields', defaultMessage: 'Please complete the required fields' }))}
            name="form-upload"
            scrollToFirstError
            initialValues={{
              amount: 10
            }}
            {...layout}
          >
            <Form.Item
              name="amount"
              label={intl.formatMessage({ id: 'enterAmount', defaultMessage: 'Enter Amount' })}
              rules={[{ required: true, message: intl.formatMessage({ id: 'amountIsRequired', defaultMessage: 'Amount is required!' }) }]}
            >
              <InputNumber onChange={(val) => setAmount(val)} style={{ width: '100%' }} min={1} max={10000} />
            </Form.Item>
            <Form.Item help={coupon && (
            <small style={{ color: 'red' }}>
              {intl.formatMessage({ id: 'discount', defaultMessage: 'Discount' })}
              {' '}
              {coupon.value * 100}
              %
            </small>
            )}
            >
              <Button.Group className="coupon-dc">
                <Input disabled={!!coupon} placeholder={intl.formatMessage({ id: 'enterCouponCodeHere', defaultMessage: 'Enter coupon code here' })} onChange={(e) => setCouponCode(e.target.value)} />
                {!coupon ? <Button disabled={!couponCode} onClick={() => applyCoupon(couponCode)}>{intl.formatMessage({ id: 'apply', defaultMessage: 'Apply!' })}</Button>
                  : (
                    <Button
                      type="primary"
                      onClick={() => {
                        setCoupon(null);
                        setCouponCode('');
                      }}
                    >
                      {intl.formatMessage({ id: 'useLater', defaultMessage: 'Use Later!' })}
                    </Button>
                  )}
              </Button.Group>
            </Form.Item>
            <Form.Item className="total-price">
              {intl.formatMessage({ id: 'total', defaultMessage: 'Total' })}
              :
              <span className="amount">
                $
                {(amount - (amount * (coupon?.value || 0))).toFixed(2)}
              </span>
            </Form.Item>
            <Form.Item className="text-center">
              <Button
                className="primary"
                disabled={!amount}
                onClick={() => setIsModalOpen(true)}
              >
                {intl.formatMessage({ id: 'buyNow', defaultMessage: 'Buy Now' })}
              </Button>
            </Form.Item>
          </Form>
        </div>
        {submiting && <Loader customText={intl.formatMessage({ id: 'weAreProcessingYourPayment', defaultMessage: 'We are processing your payment, please do not reload this page until it\'s done.' })} />}
      </div>
      <Modal
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <div className="payment-select">
          <p className="text-center payment-title">{intl.formatMessage({ id: 'selectPaymentMethod', defaultMessage: 'Select Payment Method' })}</p>
          {settings?.coinbaseEnable || settings?.ccbillEnable || settings?.stripeEnable ? (
            <Tabs
              className="payment-confirm"
              onChange={(k) => setPaymentGateway(k)}
            >
              {settings?.ccbillEnable && (
              <Tabs.TabPane tab={intl.formatMessage({ id: 'creditCard', defaultMessage: 'Credit Card' })} key="ccbill">
                <img src="/static/ccbill-img.png" alt="ccbill-img" />
              </Tabs.TabPane>
              )}
              {settings?.coinbaseEnable && (
              <Tabs.TabPane tab={intl.formatMessage({ id: 'crypto', defaultMessage: 'Crypto' })} key="coinbase">
                <img src="/static/coinbase-commerce-img.jpg" alt="coinbase-commerce-img" />
              </Tabs.TabPane>
              )}
              {settings?.stripeEnable && (
              <Tabs.TabPane tab={intl.formatMessage({ id: 'stripe', defaultMessage: 'Stripe' })} key="stripe">
                <img src="/static/stripe-icon.jpeg" alt="stripe-icon-img" />
              </Tabs.TabPane>
              )}
            </Tabs>
          ) : <p className="text-center">{intl.formatMessage({ id: 'noPaymentMethod', defaultMessage: 'No payment method' })}</p>}
          {(paymentGateway === 'coinbase' || paymentGateway === 'ccbill' || paymentGateway === 'stripe')
              && (
                <Button
                  className="primary confirm-btn"
                  onClick={() => addFund()}
                  disabled={submiting || (!settings?.coinbaseEnable && !settings?.ccbillEnable && !settings?.stripeEnable)}
                  loading={submiting}
                >
                  {intl.formatMessage({ id: 'confirm', defaultMessage: 'Confirm' })}
                </Button>
              )}
        </div>
      </Modal>
    </Layout>
  );
}

TokenPackages.authenticate = true;

const mapStates = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  settings: { ...state.settings }
});

export default connect(mapStates)(TokenPackages);
