/* eslint-disable react/destructuring-assignment */
import './performer.less';
import {
  Button, Avatar, message, Modal
} from 'antd';
import { IPerformer, ITransaction, IUser } from 'src/interfaces';
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

interface IProps {
  subscriptionType: string;
  performer: IPerformer;
  showModal: boolean;
}

function ConfirmSubscriptionPerformerForm() {
  const { subscriptionType, performer, showModal } = useSelector((state: any) => state.subscription) as IProps;
  const user = useSelector((state: any) => state.user.current) as IUser;
  const paymentGateway = useSelector((state: any) => state.settings.paymentGateway) || 'stripe';
  const [submiting, setSubmiting] = useState(false);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const socket = useContext(SocketContext);

  const subscribe = async () => {
    try {
      if (!user._id) {
        message.error('Please log in!');
        Router.push('/');
        return;
      }
      if (paymentGateway === 'stripe' && !user.stripeCardIds.length) {
        message.error('Please add a payment card');
        Router.push('/user/cards');
        return;
      }
      setSubmiting(true);
      const resp = await paymentService.subscribePerformer({
        type: subscriptionType,
        performerId: performer._id,
        paymentGateway
      });
      if (paymentGateway === 'ccbill' && subscriptionType !== 'free') {
        window.location.href = resp?.data?.paymentUrl;
      }
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      dispatch(setSubscription({ showModal: false, performerId: '' }));
      setSubmiting(false);
    }
  };

  const onConfirmPayment = (transaction: ITransaction) => {
    if (paymentGateway === 'stripe') {
      stripe && transaction?.stripeClientSecret && stripe.confirmCardPayment(transaction?.stripeClientSecret);
    }
  };

  useEffect(() => {
    socket && socket.on('stripe_confirm_payment', onConfirmPayment);
    return () => socket && socket.off('stripe_confirm_payment', onConfirmPayment);
  }, [stripe]);

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
              Subscribe
              {' '}
              <span className="username">{`@${performer?.username}` || 'the model'}</span>
            </h2>
            {subscriptionType === 'monthly' && (
            <h3>
              <span className="price">{(performer?.monthlyPrice || 0).toFixed(2)}</span>
              {' '}
              USD/month
            </h3>
            )}
            {subscriptionType === 'yearly' && (
            <h3>
              <span className="price">{(performer?.yearlyPrice || 0).toFixed(2)}</span>
              {' '}
              USD/year
            </h3>
            )}
            {subscriptionType === 'free' && (
            <h3>
              <span className="price">FREE</span>
              {' '}
              for
              {' '}
              {performer?.durationFreeSubscriptionDays}
              {' '}
              day
              {performer?.durationFreeSubscriptionDays > 1 ? 's' : ''}
            </h3>
            )}
            <ul className="check-list">
              <li>
                <CheckSquareOutlined />
                {' '}
                Full access to this model&apos;s exclusive content
              </li>
              <li>
                <CheckSquareOutlined />
                {' '}
                Direct message with this model
              </li>
              <li>
                <CheckSquareOutlined />
                {' '}
                Requested personalised Pay Per View content
              </li>
              <li>
                <CheckSquareOutlined />
                {' '}
                Cancel your subscription at any time
              </li>
            </ul>
            <Button
              className="primary"
              disabled={submiting}
              loading={submiting}
              onClick={() => subscribe()}
            >
              SUBSCRIBE
            </Button>
            <p className="sub-text">Clicking &quot;Subscribe&quot; will take you to the payment screen to finalize you subscription</p>
          </div>
        </div>
      </Modal>
      {submiting && <Loader customText="We are processing your payment, please do not reload this page until it's done." />}
    </>
  );
}

export default memo(ConfirmSubscriptionPerformerForm);
