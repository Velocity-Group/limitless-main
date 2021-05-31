import { PureComponent } from 'react';
import {
  Button
} from 'antd';
import {
  CheckCircleOutlined
} from '@ant-design/icons';
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
        <div className="profile-cover" style={{ backgroundImage: 'url(\'/static/banner-image.jpg\')' }} />
        <div className="profile-info">
          <img
            alt="main-avt"
            src={feed?.performer?.avatar || '/static/no-avatar.png'}
          />
          <div className="m-user-name">
            <h4>
              {feed?.performer?.name || 'N/A'}
                 &nbsp;
              {feed?.performer?.verifiedAccount && (
              <CheckCircleOutlined className="theme-color" />
              )}
            </h4>
            <h5 style={{ textTransform: 'none' }}>
              @
              {feed?.performer?.username || 'n/a'}
            </h5>
          </div>
        </div>
        <div className="info-body">
          <p style={{ fontSize: 12 }}>{feed?.text}</p>
        </div>
        <Button type="primary" loading={submiting} onClick={() => onFinish()}>
          UNLOCK THIS POST BY &nbsp;
          <img src="/static/coin-ico.png" width="20px" alt="coin" />
          {feed.price.toFixed(2)}
        </Button>
      </div>
    );
  }
}
