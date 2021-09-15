import { Badge, Avatar } from 'antd';
import { formatDateFromnow } from '@lib/index';
import { IConversation } from '@interfaces/message';
import './ConversationListItem.less';

interface IProps {
  data: IConversation;
  setActive: Function;
  selected: boolean;
}

export default function ConversationListItem(props: IProps) {
  const { data, setActive, selected } = props;
  const {
    recipientInfo, lastMessage, _id, totalNotSeenMessages = 0, lastMessageCreatedAt, updatedAt
  } = data;
  const className = selected
    ? 'conversation-list-item active'
    : 'conversation-list-item';

  return (
    <div aria-hidden className={className} onClick={() => setActive(_id)}>
      <div className="conversation-left-corner">
        <Avatar className="conversation-photo" src={recipientInfo?.avatar || '/static/no-avatar.png'} alt="avatar" />
        <span className={recipientInfo?.isOnline ? 'online' : 'offline'} />
      </div>
      <div className="conversation-info">
        <h1 className="conversation-title">
          <span className="re-name">{recipientInfo?.name || recipientInfo?.username || 'N/A'}</span>
          <span className="conversation-time">{formatDateFromnow(lastMessageCreatedAt || updatedAt)}</span>
        </h1>
        <p className="conversation-snippet">{lastMessage}</p>
      </div>
      <Badge
        className="notification-badge"
        count={totalNotSeenMessages}
      />
    </div>
  );
}
