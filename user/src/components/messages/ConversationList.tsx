import { PureComponent } from 'react';
import { Spin } from 'antd';
import { connect } from 'react-redux';
import { MessageIcon } from 'src/icons';
import {
  searchConversations, getConversations, setActiveConversation,
  getConversationDetail, receiveMessageSuccess, deactiveConversation
} from '@redux/message/actions';
import { Event } from 'src/socket';
import { debounce } from 'lodash';
import { IUser } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';
import ConversationSearch from './ConversationSearch';
import ConversationListItem from './ConversationListItem';
import './ConversationList.less';

interface IProps {
  searchConversations: Function;
  getConversations: Function;
  setActiveConversation: Function;
  deactiveConversation: Function;
  getConversationDetail: Function;
  receiveMessageSuccess: Function;
  conversation: {
    list: {
      requesting: boolean;
      error: any;
      data: any[];
      total: number;
      success: boolean;
    };
    mapping: Record<string, any>;
    activeConversation: Record<string, any>;
  };
  toSource: string;
  toId: string;
  message: {
    conversationMap: {};
    sendMessage: {};
  };
  user: IUser;
  intl: IntlShape
}
class ConversationList extends PureComponent<IProps> {
  state = {
    conversationPage: 0,
    keyword: ''
  }

  componentDidMount() {
    const {
      getConversations: getConversationsHandler,
      setActiveConversation: setActiveConversationHandler,
      toSource,
      toId,
      user
    } = this.props;
    const { conversationPage, keyword } = this.state;
    getConversationsHandler({
      limit: 25, offset: conversationPage * 25, type: 'private', keyword
    });
    if (toSource && toId) {
      setTimeout(() => {
        setActiveConversationHandler({
          source: toSource,
          sourceId: toId,
          recipientId: user._id
        });
      }, 1000);
    }
  }

  onMessage = (message: { conversationId: string | number; }) => {
    if (!message) {
      return;
    }
    const {
      conversation,
      getConversationDetail: getConversationDetailHandler,
      receiveMessageSuccess: receiveMessageSuccessHandler
    } = this.props;
    const { mapping } = conversation;
    if (!mapping[message.conversationId]) {
      getConversationDetailHandler({
        id: message.conversationId
      });
    }
    receiveMessageSuccessHandler(message);
  };

  onSearchConversation = debounce(async (e) => {
    const { value } = e.target;
    const { searchConversations: getConversationsHandler } = this.props;
    this.setState({ keyword: value, conversationPage: 0 });
    if (value) {
      return getConversationsHandler({
        keyword: value, limit: 25, offset: 0, type: 'private'
      });
    }
    return getConversationsHandler({ limit: 25, offset: 0, type: 'private' });
  }, 500);

  handleScroll = async (event: { target: any; }) => {
    const { conversation, getConversations: getConversationsHandler } = this.props;
    const { requesting, data, total } = conversation.list;
    const { conversationPage, keyword } = this.state;
    const canloadmore = total > data.length;
    const ele = event.target;
    if (!canloadmore) return;
    if ((ele.offsetHeight + ele.scrollTop >= ele.scrollHeight - 10) && !requesting && canloadmore) {
      this.setState({ conversationPage: conversationPage + 1 });
      getConversationsHandler({
        keyword, limit: 25, offset: conversationPage + 1, type: 'private'
      });
    }
  }

  setActive = (conversationId: any) => {
    const {
      setActiveConversation: setActive, deactiveConversation: setDeactive, conversation
    } = this.props;
    setActive({ conversationId });
    conversation?.activeConversation?._id && setDeactive(conversation?.activeConversation?._id);
  };

  render() {
    const { conversation, intl } = this.props;
    const { data: conversations, requesting } = conversation.list;
    const { mapping, activeConversation = {} } = conversation;
    return (
      <div className="conversation-list">
        <Event event="message_created" handler={this.onMessage} />
        <div className="user-bl">
          <MessageIcon />
          {' '}
          {intl.formatMessage({ id: 'chats', defaultMessage: 'Chats' })}
        </div>
        <ConversationSearch
          onSearch={(e) => {
            e.persist();
            this.onSearchConversation(e);
          }}
        />
        <div className="c-list-container" onScroll={this.handleScroll.bind(this)}>
          {conversations.length > 0
          && conversations.map((conversationId) => (
            <ConversationListItem
              key={conversationId}
              data={mapping[conversationId]}
              setActive={this.setActive}
              selected={activeConversation._id === conversationId}
            />
          ))}
          {requesting && (
          <div className="text-center" style={{ margin: 30 }}><Spin /></div>
          )}
          {!requesting && !conversations.length && (
          <p className="text-center">{intl.formatMessage({ id: 'noConversationFound', defaultMessage: 'No conversation found.' })}</p>
          )}
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  conversation: { ...state.conversation },
  message: { ...state.message },
  user: { ...state.user.current }
});

const mapDispatch = {
  searchConversations,
  getConversations,
  setActiveConversation,
  deactiveConversation,
  getConversationDetail,
  receiveMessageSuccess
};
export default injectIntl(connect(mapStates, mapDispatch)(ConversationList));
