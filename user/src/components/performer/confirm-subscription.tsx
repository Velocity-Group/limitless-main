/* eslint-disable react/destructuring-assignment */
import './performer.less';
import {
  Button, Avatar, message, Modal, Tabs
} from 'antd';
import {
  IPerformer, ISettings, ITransaction, IUser
} from 'src/interfaces';
import {
  CheckSquareOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { useDispatch, useSelector } from 'react-redux';
import Router from 'next/router';
import { paymentService } from '@services/payment.service';
import {
  memo, useContext, useEffect, useState
} from 'react';
import { setSubscription } from '@redux/subscription/actions';
import Loader from '@components/common/base/loader';
import { useStripe } from '@stripe/react-stripe-js';
import { SocketContext } from 'src/socket';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  subscriptionType: string;
  performer: IPerformer;
  showModal: boolean;
}

function ConfirmSubscriptionPerformerForm() {
  const { subscriptionType, performer, showModal } = useSelector((state: any) => state.subscription) as IProps;
  const user = useSelector((state: any) => state.user.current) as IUser;
  const settings: ISettings = useSelector((state: any) => state.settings);
  const [paymentGateway, setPaymentGateway] = useState('');
  const [submiting, setSubmiting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const socket = useContext(SocketContext);
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

  const subscribe = async () => {
    try {
      if (!user._id) {
        message.error(intl.formatMessage({ id: 'pleaseLogin', defaultMessage: 'Please login!' }));
        Router.push('/auth/login');
        return;
      }
      if (paymentGateway === 'stripe' && !user.stripeCardIds.length) {
        message.error(intl.formatMessage({ id: 'pleaseAddAPaymentCard', defaultMessage: 'Please add a payment card!' }));
        Router.push('/user/cards');
        return;
      }
      setSubmiting(true);
      const resp = await paymentService.subscribePerformer({
        type: subscriptionType,
        performerId: performer._id,
        paymentGateway
      });
      if (['coinbase', 'ccbill'].includes(paymentGateway) && subscriptionType !== 'free') {
        window.location.href = resp?.data?.paymentUrl;
      }
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      dispatch(setSubscription({ showModal: false, performer: '' }));
      setSubmiting(false);
    }
  };

  const onConfirmPayment = (transaction: ITransaction) => {
    stripe && transaction?.stripeClientSecret && stripe.confirmCardPayment(transaction?.stripeClientSecret);
  };

  useEffect(() => {
    socket && socket.on('stripe_confirm_payment', onConfirmPayment);
    return () => socket && socket.off('stripe_confirm_payment', onConfirmPayment);
  }, [stripe, paymentGateway]);

  return (
    <>
      <Modal
        key="subscribe_performer"
        className="subscription-modal"
        width={600}
        centered
        maskClosable={false}
        title={null}
        visible={showModal}
        footer={null}
        onCancel={() => dispatch(setSubscription({ showModal: false }))}
      >
        <div className="confirm-purchase-form">
          <div className="left-col">
            <Avatar src={performer?.avatar || '/static/no-avatar.png'} />
            <div className="p-name">
              {performer?.name || 'N/A'}
              {' '}
              {performer?.verifiedAccount && <TickIcon className="primary-color" />}
            </div>
            <div className="p-username">
              @
              {performer?.username || 'n/a'}
            </div>
            <img className="lock-icon" src="/static/lock-icon.png" alt="lock" />
          </div>
          <div className="right-col">
            <h2>
              {intl.formatMessage({ id: 'subscribe', defaultMessage: 'Subscribe' })}
              {' '}
              <span className="username">{`@${performer?.username}` || intl.formatMessage({ id: 'theModel', defaultMessage: 'the model' })}</span>
            </h2>
            {subscriptionType === 'monthly' && (
            <h3>
              <span className="price">{(performer?.monthlyPrice || 0).toFixed(2)}</span>
              {' '}
              {intl.formatMessage({ id: 'usdMonth', defaultMessage: 'USD/month' })}
            </h3>
            )}
            {subscriptionType === 'yearly' && (
            <h3>
              <span className="price">{(performer?.yearlyPrice || 0).toFixed(2)}</span>
              {' '}
              {intl.formatMessage({ id: 'usdYear', defaultMessage: 'USD/year' })}
            </h3>
            )}
            {subscriptionType === 'free' && (
            <h3>
              <span className="price" style={{ textTransform: 'uppercase' }}>{intl.formatMessage({ id: 'free', defaultMessage: 'Free' })}</span>
              {' '}
              {intl.formatMessage({ id: 'for', defaultMessage: 'for' })}
              {' '}
              {performer?.durationFreeSubscriptionDays}
              {' '}
              {intl.formatMessage({ id: 'day', defaultMessage: 'day' })}
              {performer?.durationFreeSubscriptionDays > 1 ? 's' : ''}
            </h3>
            )}
            <ul className="check-list">
              <li>
                <CheckSquareOutlined />
                {' '}
                {intl.formatMessage({ id: 'fullAccessToThisModelsContent', defaultMessage: 'Full access to this model\'s content' })}
              </li>
              <li>
                <CheckSquareOutlined />
                {' '}
                {intl.formatMessage({ id: 'directMessageWithThisModel', defaultMessage: 'Direct message with this model' })}
              </li>
              <li>
                <CheckSquareOutlined />
                {' '}
                {intl.formatMessage({ id: 'requestedPersonalisedPayPerViewContent', defaultMessage: 'Requested personalised Pay Per View conten' })}
              </li>
              <li>
                <CheckSquareOutlined />
                {' '}
                {intl.formatMessage({ id: 'cancelYourSubscriptionAtAnyTime', defaultMessage: 'Cancel your subscription at any time' })}
              </li>
            </ul>
            <Button
              className="primary"
              disabled={submiting}
              loading={submiting}
              onClick={() => setIsModalOpen(true)}
              style={{ textTransform: 'uppercase' }}
            >
              {intl.formatMessage({ id: 'subscribe', defaultMessage: 'Subscribe' })}
            </Button>
            <p className="sub-text">{intl.formatMessage({ id: 'clickingSubscribeConfirmWillTakeYouToThePaymentScreenToFinalizeYouSubscription', defaultMessage: 'Clicking \'Subscribe\' Confirm will take you to the payment screen to finalize you subscription' })}</p>
          </div>
        </div>
      </Modal>
      {submiting && <Loader customText={intl.formatMessage({ id: 'weAreProcessingYourPayment', defaultMessage: 'We are processing your payment, please do not reload this page until it\'s done.' })} />}
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
                  onClick={() => subscribe()}
                  disabled={submiting || (!settings?.coinbaseEnable && !settings?.ccbillEnable && !settings?.stripeEnable)}
                  loading={submiting}
                >
                  {intl.formatMessage({ id: 'confirm', defaultMessage: 'Confirm' })}
                </Button>
              )}
        </div>
      </Modal>
    </>
  );
}

export default memo(ConfirmSubscriptionPerformerForm);
