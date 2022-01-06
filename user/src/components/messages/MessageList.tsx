import { PureComponent, createRef } from 'react';
import { Spin, Avatar } from 'antd';
import { TickIcon } from 'src/icons';
import { connect } from 'react-redux';
import moment from 'moment';
import { loadMoreMessages } from '@redux/message/actions';
import Link from 'next/link';
import Router from 'next/router';
import Compose from './Compose';
import Message from './Message';
import './MessageList.less';

interface IProps {
  sendMessage: any;
  loadMoreMessages: Function;
  message: any;
  conversation: any;
  currentUser: any;
}

class MessageList extends PureComponent<IProps> {
  messagesRef: any;

  state = {
    offset: 0
  }

  async componentDidMount() {
    if (!this.messagesRef) this.messagesRef = createRef();
  }

  async componentDidUpdate(prevProps) {
    const { conversation, message, sendMessage } = this.props;
    if (prevProps.conversation && prevProps.conversation._id !== conversation._id) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ offset: 0 });
    }
    if ((prevProps.message.total === 0 && message.total !== 0) || (prevProps.message.total === message.total)) {
      if (prevProps.sendMessage?.data?._id !== sendMessage?.data?._id) {
        this.scrollToBottom(true);
        return;
      }
      this.scrollToBottom(false);
    }
  }

  async handleScroll(conversation, event) {
    const { message, loadMoreMessages: handleLoadMore } = this.props;
    const { offset } = this.state;
    const { fetching, items, total } = message;
    const canloadmore = total > items.length;
    const ele = event.target;
    if (!canloadmore) return;
    if (ele.scrollTop === 0 && conversation._id && !fetching && canloadmore) {
      this.setState({ offset: offset + 1 },
        () => {
          const { offset: newOffset } = this.state;
          handleLoadMore({ conversationId: conversation._id, limit: 25, offset: newOffset * 25 });
        });
    }
  }

 renderMessages = () => {
   const { message, currentUser, conversation } = this.props;
   const recipientInfo = conversation && conversation.recipientInfo;
   const messages = message.items;
   let i = 0;
   const messageCount = messages.length;
   const tempMessages = [];
   while (i < messageCount) {
     const previous = messages[i - 1];
     const current = messages[i];
     const next = messages[i + 1];
     const isMine = current.senderId === currentUser._id;
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
           key={i}
           isMine={isMine}
           startsSequence={startsSequence}
           endsSequence={endsSequence}
           showTimestamp={showTimestamp}
           data={current}
           recipient={recipientInfo}
           currentUser={currentUser}
         />
       );
     }
     // Proceed to the next message.
     i += 1;
   }
   return tempMessages;
 };

 scrollToBottom(toBot = true) {
   const { message: { fetching } } = this.props;
   const { offset } = this.state;
   if (!fetching && this.messagesRef && this.messagesRef.current) {
     const ele = this.messagesRef.current;
     window.setTimeout(() => {
       ele.scrollTop = toBot ? ele.scrollHeight : (ele.scrollHeight / (offset + 1) - 150);
     }, 300);
   }
 }

 render() {
   const { conversation, message } = this.props;
   const { fetching } = message;
   if (!this.messagesRef) this.messagesRef = createRef();
   return (
     <div className="message-list" ref={this.messagesRef} onScroll={this.handleScroll.bind(this, conversation)}>
       {conversation && conversation._id
         ? (
           <>
             <div className="message-list-container">
               <div aria-hidden className="mess-recipient" onClick={() => conversation?.recipientInfo?.isPerformer && Router.push({ pathname: '/model/profile', query: { username: conversation?.recipientInfo?.username || conversation?.recipientInfo?._id } }, `/${conversation?.recipientInfo?.username || conversation?.recipientInfo?._id}`)}>
                 <Avatar alt="avatar" src={conversation?.recipientInfo?.avatar || '/static/no-avatar.png'} />
                 {' '}
                 {conversation?.recipientInfo?.name || conversation?.recipientInfo?.username || 'N/A'}
                 {' '}
                 {conversation?.recipientInfo?.verifiedAccount && <TickIcon />}
               </div>
               {fetching && <div className="text-center"><Spin /></div>}
               {this.renderMessages()}
               {!fetching && !message.items.length && <p className="text-center">Let&apos;s talking</p>}
               {!conversation.isSubscribed && (
               <Link href={{ pathname: '/model/profile', query: { username: conversation?.recipientInfo?.username || conversation?.recipientInfo?._id } }} as={`/${conversation?.recipientInfo?.username || conversation?.recipientInfo?._id}`}>
                 <div className="sub-text">Please subscribe to this model to start the conversation!</div>
               </Link>
               )}
               {conversation.isBlocked && <div className="sub-text">This model has blocked you!</div>}
             </div>
             <Compose disabled={!conversation.isSubscribed || conversation.isBlocked} conversation={conversation} />
           </>
         )
         : <p className="text-center">Click on conversation to start</p>}
     </div>
   );
 }
}

const mapStates = (state: any) => {
  const { conversationMap, sendMessage } = state.message;
  const { activeConversation } = state.conversation;
  const messages = conversationMap[activeConversation._id]
    ? conversationMap[activeConversation._id].items || []
    : [];
  const totalMessages = conversationMap[activeConversation._id]
    ? conversationMap[activeConversation._id].total || 0
    : 0;
  const fetching = conversationMap[activeConversation._id]
    ? conversationMap[activeConversation._id].fetching || false : false;
  return {
    sendMessage,
    message: {
      items: messages,
      total: totalMessages,
      fetching
    },
    conversation: activeConversation,
    currentUser: state.user.current
  };
};

const mapDispatch = { loadMoreMessages };
export default connect(mapStates, mapDispatch)(MessageList);
