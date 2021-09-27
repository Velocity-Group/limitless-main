/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import {
  Button, Avatar
} from 'antd';
import { IPerformer } from 'src/interfaces';
import {
  CheckSquareOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import './performer.less';

interface IProps {
  type: string;
  performer: IPerformer;
  onFinish: Function;
  submiting: boolean;
}

export class ConfirmSubscriptionPerformerForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, submiting = false, performer, type
    } = this.props;
    return (
      <div className="confirm-subscription-form">
        <div className="text-center">
          <Avatar src={performer?.avatar || '/static/no-avatar.png'} />
          <p>
            {performer?.name || performer?.username || 'N/A'}
            {' '}
            {performer?.verifiedAccount && <TickIcon className="primary-color" />}
          </p>
        </div>
        <div className="info-body">
          <p>
            SUBSCRIBE & GET THIS BENEFITS
          </p>
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
        <Button className="primary" disabled={submiting} loading={submiting} onClick={() => onFinish()} style={{ textTransform: 'uppercase', whiteSpace: 'pre-wrap', height: 'auto' }}>
          Confirm
          {' '}
          {type}
          {' '}
          subscription
          {' '}
          {type !== 'free' ? (
            <>
              for $
              {' '}
              {type === 'monthly' ? performer.monthlyPrice.toFixed(2) : performer.yearlyPrice.toFixed(2)}
            </>
          ) : (
            <>
              {' '}
              in
              {' '}
              {performer.durationFreeSubscriptionDays}
              {' '}
              days then $
              {performer.monthlyPrice.toFixed(2)}
              {' '}
              monthly later
            </>
          )}
        </Button>
      </div>
    );
  }
}
