import { IPerformer } from '@interfaces/performer';
import { getResponseError } from '@lib/utils';
import { performerService } from '@services/performer.service';
import {
  Avatar, message, Modal, Spin, Button
} from 'antd';
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
  const [submiting, setSubmiting] = useState<boolean>();
  const currentUser = useSelector((state: any) => state.user.current);
  const settings = useSelector((state: any) => state.settings);
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
      message.error('Please log in!');
      Router.push('/');
      return;
    }
    if (settings.paymentGateway === 'stripe' && !currentUser.stripeCardIds.length) {
      message.error('Please add a payment card');
      Router.push('/user/cards');
      return;
    }
    try {
      setSubmiting(true);
      const resp = await paymentService.subscribePerformer({
        type: subscriptionType,
        performerId: performer._id,
        paymentGateway: settings.paymentGateway
      });
      if (settings.paymentGateway === 'ccbill') {
        window.location.href = resp?.data?.paymentUrl;
      } else {
        setSubmiting(false);
        dispatch(hideSubscribePerformerModal());
        onSubscribed && onSubscribed(performer?.username || performer?._id);
      }
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    }
  };

  const onCancel = () => {
    dispatch(hideSubscribePerformerModal());
  };

  return (
    <Modal
      visible={subscription.showModal}
      destroyOnClose
      centered
      width={770}
      footer={null}
      onCancel={onCancel}
    >
      {loading && <div style={{ margin: 30, textAlign: 'center' }}><Spin /></div>}
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
          <h3>
            <span className="price">{(performer?.monthlyPrice || 0).toFixed(2)}</span>
            {' '}
            USD/month
          </h3>
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
            onClick={() => subscribe('monthly')}
          >
            SUBSCRIBE
          </Button>
          <p className="sub-text">Clicking &quot;Subscribe&quot; will take you to the payment screen to finalize you subscription</p>
        </div>
      </div>
    </Modal>
  );
};

SubscribePerformerModal.defaultProps = {
  onSubscribed: null
};
