import { PureComponent } from 'react';
import { Tooltip, Button } from 'antd';
import { } from '@ant-design/icons';
import { formatDateFromnow } from '@lib/index';
import { StreamSettings } from 'src/interfaces/index';
import Router from 'next/router';
import './index.less';

interface IProps {
  request: any;
  settings: StreamSettings;
  onDecline: Function;
}

export class PrivateCallCard extends PureComponent<IProps> {
  render() {
    const { request, settings, onDecline } = this.props;
    const {
      user, userNote, createdAt
    } = request;
    return (
      <div className="private-call-card">
        <div className="user-info">
          <img alt="p-avt" src={(user?.avatar) || '/static/no-avatar.png'} />
          <div className="user-name">
            <span>{user?.name}</span>
            <small>
              @
              {user?.username}
            </small>
          </div>
        </div>
        {userNote && (
        <Tooltip title={userNote}>
          <p className="user-note">{userNote}</p>
        </Tooltip>
        )}
        <div className="date-time">{formatDateFromnow(createdAt)}</div>
        <div style={{ display: 'flex' }}>
          <Button
            block
            className="success"
            onClick={() => Router.push({
              pathname: `/live/${
                settings.optionForPrivate === 'webrtc'
                  ? 'webrtc/'
                  : ''
              }privatechat`,
              query: { id: request.conversationId }
            }, `/live/${
              settings.optionForPrivate === 'webrtc'
                ? 'webrtc/'
                : ''
            }privatechat/${request.conversationId}`)}
          >
            Accept
          </Button>
          <Button className="error" block onClick={() => onDecline(request.conversationId)}>Decline</Button>
        </div>
      </div>
    );
  }
}
