import { PureComponent, createRef } from 'react';
import { Spin } from 'antd';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  loadMoreStreamMessages,
  receiveStreamMessageSuccess,
  deleteMessage,
  deleteMessageSuccess
} from '@redux/stream-chat/actions';
import { SocketContext } from 'src/socket';
import { IUser, IPerformer } from 'src/interfaces';
import '@components/messages/MessageList.less';
import Compose from './Compose';
import Message from './Message';

interface IProps {
  loadMoreStreamMessages: Function;
  receiveStreamMessageSuccess: Function;
  message: any;
  conversation: any;
  user: IUser & IPerformer;
  messagesRef: any;
  deleteMessage: Function;
  deleteMessageSuccess: Function;
  loggedIn?: boolean;
}

const canDelete = ({ isDeleted, senderId, performerId }, user): boolean => {
  if (isDeleted) return false;
  let check = false;
  if (user && user._id) {
    if (user.roles && user.roles.includes('admin')) {
      check = true;
    } if (senderId === user._id) {
      check = true;
    } if (performerId === user._id) {
      check = true;
    }
  }
  return check;
};

class MessageList extends PureComponent<IProps> {
  messagesRef: any;

  state = {
    offset: 0
  };

  async componentDidMount() {
    if (!this.messagesRef) this.messagesRef = createRef();
    const { conversation } = this.props;
    const socket = this.context;
    if (conversation && conversation._id) {
      socket
        && socket.on
        && socket.on(
          `message_created_conversation_${conversation._id}`,
          (data) => {
            this.onMessage(data, 'created');
          }
        );
      socket
        && socket.on
        && socket.on(
          `message_deleted_conversation_${conversation._id}`,
          (data) => {
            this.onMessage(data, 'deleted');
          }
        );
    }
  }

  componentWillUnmount() {
    const { conversation } = this.props;
    const socket = this.context;
    socket && socket.off(`message_created_conversation_${conversation._id}`);
    socket && socket.off(`message_deleted_conversation_${conversation._id}`);
  }

  async handleScroll(conversation, event) {
    const {
      message: { fetching, items, total },
      loadMoreStreamMessages: loadMore
    } = this.props;
    const { offset } = this.state;
    const canloadmore = total > items.length;
    const ele = event.target;
    if (!canloadmore) return;
    if (ele.scrollTop === 0 && conversation._id && !fetching && canloadmore) {
      await this.setState({ offset: offset + 1 });
      loadMore({
        conversationId: conversation._id,
        limit: 25,
        offset: (offset + 1) * 25,
        type: conversation.type
      });
    }
  }

  onDelete(messageId) {
    const { deleteMessage: _deleteMessage } = this.props;
    if (!messageId) return;
    _deleteMessage({ messageId });
  }

  renderMessages = () => {
    const { message, conversation, user } = this.props;
    const messages = message.items;
    let i = 0;
    const messageCount = messages && messages.length;
    const tempMessages = [];
    while (i < messageCount) {
      const previous = messages[i - 1];
      const current = messages[i];
      const next = messages[i + 1];
      const isMine = user && current.senderId === user._id;
      const currentMoment = moment(current.createdAt);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;
      if (previous) {
        const previousMoment = moment(previous.createdAt);
        const previousDuration = moment.duration(
          currentMoment.diff(previousMoment)
        );
        prevBySameAuthor = previous.senderId === current.senderId;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
        }
      }

      if (next) {
        const nextMoment = moment(next.createdAt);
        const nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.senderId === current.senderId;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }
      if (current._id) {
        tempMessages.push(
          <Message
            onDelete={this.onDelete.bind(this, current._id)}
            canDelete={canDelete({ ...current, performerId: conversation.performerId }, user)}
            isOwner={conversation.performerId === current.senderId}
            key={i}
            isMine={isMine}
            startsSequence={startsSequence}
            endsSequence={endsSequence}
            showTimestamp={showTimestamp}
            data={current}
          />
        );
      }
      // Proceed to the next message.
      i += 1;
    }
    this.scrollToBottom();
    return tempMessages;
  };

  onMessage = (message, type) => {
    if (!message) {
      return;
    }

    const { receiveStreamMessageSuccess: create, deleteMessageSuccess: remove } = this.props;
    type === 'created' && create(message);
    type === 'deleted' && remove(message);
  };

  scrollToBottom() {
    const { message } = this.props;
    const { fetching } = message;
    const { offset } = this.state;
    if (this.messagesRef && this.messagesRef.current) {
      const ele = this.messagesRef.current;
      if (fetching) return;
      window.setTimeout(() => {
        ele.scrollTop = !offset ? ele.scrollHeight : ele.scrollHeight / (offset + 1);
      }, 300);
    }
  }

  render() {
    const { conversation, loggedIn } = this.props;
    const {
      message: { fetching }
    } = this.props;
    if (!this.messagesRef) this.messagesRef = createRef();
    return (
      <div
        className="message-list"
        ref={this.messagesRef}
        onScroll={this.handleScroll.bind(this, conversation)}
      >
        {conversation && conversation._id && (
          <>
            <div className="message-list-container">
              {fetching && <div className="text-center"><Spin /></div>}
              {this.renderMessages()}
            </div>
            <Compose conversation={conversation} loggedIn={loggedIn} />
          </>
        )}
      </div>
    );
  }
}

MessageList.contextType = SocketContext;

const mapStates = (state: any) => {
  const { conversationMap, activeConversation } = state.streamMessage;
  const messages = activeConversation.data && conversationMap[activeConversation.data._id]
    ? conversationMap[activeConversation.data._id].items || []
    : [];
  const totalMessages = activeConversation.data && conversationMap[activeConversation.data._id]
    ? conversationMap[activeConversation.data._id].total || 0
    : 0;
  const fetching = activeConversation.data && conversationMap[activeConversation.data._id]
    ? conversationMap[activeConversation.data._id].fetching || false
    : false;
  return {
    message: {
      items: messages,
      total: totalMessages,
      fetching
    },
    conversation: activeConversation.data,
    user: state.user.current
  };
};

const mapDispatch = {
  loadMoreStreamMessages,
  receiveStreamMessageSuccess,
  deleteMessage,
  deleteMessageSuccess
};
export default connect(mapStates, mapDispatch)(MessageList);
