import { PureComponent } from 'react';
import {
  Button, Avatar
} from 'antd';
import { IFeed, IUser } from '@interfaces/index';
import './index.less';

interface IProps {
  user?: IUser;
  feed: IFeed;
  onFinish: Function;
  submiting: boolean;
}

export class PurchaseFeedForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, submiting = false, feed
    } = this.props;

    return (
      <div className="confirm-subscription-form">
        <div className="text-center">
          <Avatar
            alt="main-avt"
            src={feed?.performer?.avatar || '/static/no-avatar.png'}
          />
        </div>
        <div className="info-body">
          <p style={{ fontSize: 12 }}>{feed?.text}</p>
        </div>
        <Button type="primary" loading={submiting} onClick={() => onFinish()}>
          UNLOCK THIS POST FOR &nbsp;
          $
          {(feed.price || 0).toFixed(2)}
        </Button>
      </div>
    );
  }
}
