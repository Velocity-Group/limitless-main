import React from 'react';
import moment from 'moment';
import { IUser, IPerformer } from '@interfaces/index';
import './Message.less';

interface IProps {
  data: any;
  isMine: boolean;
  startsSequence: boolean;
  endsSequence: boolean;
  showTimestamp: boolean;
  currentUser: IUser | IPerformer,
  recipient: IUser | IPerformer,
}

export default function Message(props: IProps) {
  const {
    data, isMine, startsSequence, endsSequence, showTimestamp, currentUser, recipient
  } = props;

  const friendlyTimestamp = moment(data.createdAt).format('LLLL');
  return (
    <div
      className={[
        'message',
        `${isMine ? 'mine' : ''}`,
        `${startsSequence ? 'start' : ''}`,
        `${endsSequence ? 'end' : ''}`
      ].join(' ')}
    >

      {data.text && (
        <div className="bubble-container">
          {!isMine && <img alt="" className="avatar" src={recipient?.avatar || '/static/no-avatar.png'} />}
          <div className="bubble" title={friendlyTimestamp}>
            {!data.imageUrl && data.text}
            {' '}
            {data.imageUrl && <a rel="noreferrer" title="Click to view full content" aria-label="Click to view full content" href={data?.imageUrl} target="_blank"><img alt="" src={data.imageUrl} /></a>}
          </div>
          {isMine && <img alt="" src={currentUser?.avatar || '/static/no-avatar.png'} className="avatar" />}
        </div>
      )}
      {showTimestamp && <div className="timestamp">{friendlyTimestamp}</div>}
    </div>
  );
}
