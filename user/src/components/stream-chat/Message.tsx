/* eslint-disable react/no-danger */
import React from 'react';
import moment from 'moment';
import { EllipsisOutlined } from '@ant-design/icons';
import { Menu, Dropdown } from 'antd';
import '@components/messages/Message.less';

interface IProps {
  data: any;
  isMine: boolean,
  startsSequence: boolean,
  endsSequence: boolean,
  showTimestamp: boolean,
  isOwner: boolean,
  onDelete: Function,
}

export default function Message(props: IProps) {
  const {
    data,
    isMine,
    startsSequence,
    endsSequence,
    showTimestamp,
    isOwner,
    onDelete
  } = props;
  const friendlyTimestamp = moment(data.createdAt).format('LLLL');
  const menu = (
    <Menu>
      <Menu.Item onClick={() => onDelete()}>
        Delete
      </Menu.Item>
    </Menu>
  );
  return (
    <div
      className={[
        'message',
        `${startsSequence ? 'start' : ''}`,
        `${endsSequence ? 'end' : ''}`
      ].join(' ')}
    >
      {data.text && !data.isSystem && !data.isTip && !data.isGift && (
        <div className={isOwner ? 'bubble-container owner' : 'bubble-container'}>
          <span className="sender-info">
            <img alt="" src={data?.senderInfo?.avatar || '/static/no-avatar.png'} className="avatar" />
            <a>
              {data?.senderInfo?.name || data?.senderInfo?.username || 'N/A'}
              :
            </a>
          </span>
          <div className="bubble" title={friendlyTimestamp}>
            {data.text}
          </div>
          {isMine && !data.isDeleted && (
          <Dropdown overlay={menu} placement="topRight">
            <a>
              <EllipsisOutlined style={{ transform: 'rotate(90deg)' }} />
            </a>
          </Dropdown>
          )}
        </div>
      )}
      {data.text && data.isTip && (
      <div className="tip-box">
        <span>
          {data.text}
          {' '}
          <img src="/static/coin-ico.png" width="20px" alt="" />
        </span>
      </div>
      )}
      {data.text && data.isGift && (
      <div className="tip-box">
        <span dangerouslySetInnerHTML={{ __html: data.text }} />
      </div>
      )}
      {showTimestamp && (
        <div className="timestamp">{friendlyTimestamp}</div>
      )}
    </div>
  );
}
