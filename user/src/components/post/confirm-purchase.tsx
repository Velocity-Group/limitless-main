import {
  Button, Avatar
} from 'antd';
import { IFeed } from '@interfaces/index';
import { TickIcon } from 'src/icons';
import './index.less';
import { useIntl, IntlShape } from 'react-intl';

interface IProps {
  feed: IFeed;
  onFinish: Function;
  submiting: boolean;
}

function PurchaseFeedForm(props: IProps) {
  const {
    onFinish, submiting = false, feed
  } = props;
  const intl: IntlShape = useIntl();

  return (
    <div className="confirm-purchase-form">
      <div className="left-col">
        <Avatar src={feed?.performer?.avatar || '/static/no-avatar.png'} />
        <div className="p-name">
          {feed?.performer?.name || 'N/A'}
          {' '}
          {feed?.performer?.verifiedAccount && <TickIcon className="primary-color" />}
        </div>
        <div className="p-username">
          @
          {feed?.performer?.username || 'n/a'}
        </div>
        <img className="lock-icon" src="/static/lock-icon.png" alt="lock" />
      </div>
      <div className="right-col">
        <h2>
          {intl.formatMessage({ id: 'unlockContent', defaultMessage: 'Unlock Content' })}
        </h2>
        <h3>
          <span className="price">{(feed.price || 0).toFixed(2)}</span>
          {' '}
          USD
        </h3>
        <p className="description">
          {feed.text}
        </p>
        <Button
          className="primary"
          disabled={submiting}
          loading={submiting}
          onClick={() => onFinish()}
        >
          {intl.formatMessage({ id: 'confirmToUnlock', defaultMessage: 'Confirm To Unlock' })}
        </Button>
      </div>
    </div>
  );
}

export default PurchaseFeedForm;
