import { IPerformer } from '@interfaces/performer';
import { getResponseError } from '@lib/utils';
import { performerService } from '@services/performer.service';
import { Avatar, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Router from 'next/router';
import { paymentService } from '@services/payment.service';
import { hideSubscribePerformerModal } from '@redux/subscription/actions';
import { CheckSquareOutlined } from '@ant-design/icons';
import { TickIcon } from 'src/icons';

type Props = {
  onSubscribed?: Function;
}

export const SubscribePerformerModal: React.FC<Props> = ({ onSubscribed }: Props) => {
  const [performer, setPerformer] = useState<IPerformer>();
  const [loading, setLoading] = useState(false);
  const [submiting, setSubmiting] = useState<string>();
  const currentUser = useSelector((state: any) => state.user.current);
  const subscription = useSelector((state: any) => state.subscription);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetctPerformer = async () => {
      try {
        setLoading(true);
        const resp = await performerService.findOne(
          subscription.subscribingPerformerId
        );
        setPerformer(resp.data);
      } catch (e) {
        const error = await Promise.resolve(e);
        message.error(getResponseError(error));
      } finally {
        setLoading(false);
      }
    };

    subscription.subscribingPerformerId && fetctPerformer();
  }, [subscription.subscribingPerformerId]);

  const subscribe = async (subscriptionType: string) => {
    if (!currentUser._id) {
      message.error('Please log in');
      Router.push('/auth/login');
      return;
    }
    if (!currentUser.stripeCardIds || !currentUser.stripeCardIds.length) {
      message.error('Please add a payment card');
      Router.push('/user/cards');
      return;
    }
    try {
      setSubmiting(subscriptionType);
      await paymentService.subscribePerformer({
        type: subscriptionType,
        performerId: performer._id,
        paymentGateway: 'stripe',
        stripeCardId: currentUser.stripeCardIds[0] // TODO user can choose card
      });
      onSubscribed && onSubscribed(performer.username);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      setSubmiting(null);
      dispatch(hideSubscribePerformerModal());
    }
  };

  const onCancel = () => {
    dispatch(hideSubscribePerformerModal());
  };

  return (
    <Modal
      visible={subscription.showModal}
      width={770}
      footer={null}
      onCancel={onCancel}
    >
      {loading && <p>Loading...</p>}
      <div className="confirm-subscription-form">
        <div className="text-center">
          <h3 className="secondary-color">
            Confirm subscription with
            {' '}
            {performer?.name || performer?.username || 'the model'}
          </h3>
          <Avatar src={performer?.avatar || '/static/no-avatar.png'} />
          <p className="p-name">
            {performer?.name || performer?.username || 'N/A'}
            {' '}
            {performer?.verifiedAccount && (
              <TickIcon className="primary-color" />
            )}
          </p>
        </div>
        <div className="info-body">
          <p>SUBSCRIBE TO GET THESE BENEFITS</p>
          <ul>
            <li>
              <CheckSquareOutlined />
              {' '}
              Full access to this model&apos;s content
            </li>
            <li>
              <CheckSquareOutlined />
              {' '}
              Direct message with this model
            </li>
            <li>
              <CheckSquareOutlined />
              {' '}
              Cancel your subscription at any time
            </li>
          </ul>
        </div>
      </div>
      {!loading && performer && !performer?.isSubscribed && (
        <div className="subscription-bl">
          <h5>Monthly Subscription</h5>
          <button
            type="button"
            className="sub-btn"
            disabled={submiting && submiting === 'monthly'}
            onClick={() => {
              subscribe('monthly');
            }}
          >
            SUBSCRIBE FOR $
            {performer && performer?.monthlyPrice.toFixed(2)}
          </button>
        </div>
      )}
      {!loading && performer && !performer?.isSubscribed && (
        <div className="subscription-bl">
          <h5>Yearly Subscription</h5>
          <button
            type="button"
            className="sub-btn"
            disabled={submiting === 'yearly'}
            onClick={() => {
              subscribe('yearly');
            }}
          >
            SUBSCRIBE FOR $
            {performer?.yearlyPrice.toFixed(2)}
          </button>
        </div>
      )}
      {!loading
        && performer
        && performer?.isFreeSubscription
        && !performer?.isSubscribed && (
          <div className="subscription-bl">
            <h5>Free Subscription</h5>
            <button
              type="button"
              className="sub-btn"
              disabled={submiting === 'free'}
              onClick={() => {
                subscribe('free');
              }}
            >
              SUBSCRIBE FOR FREE FOR
              {' '}
              {performer?.durationFreeSubscriptionDays || 1}
              {' '}
              {performer?.durationFreeSubscriptionDays > 1 ? 'DAYS' : 'DAY'}
              {' '}
              THEN $
              {performer?.monthlyPrice.toFixed(2)}
              {' '}
              PER MONTH
            </button>
          </div>
      )}
    </Modal>
  );
};

SubscribePerformerModal.defaultProps = {
  onSubscribed: null
};
