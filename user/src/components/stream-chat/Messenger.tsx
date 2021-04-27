import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getStreamConversation } from '@redux/stream-chat/actions';
import MessageList from './MessageList';
import '@components/messages/Messenger.less';

interface IProps {
  streamId?: string;
  loggedIn?: boolean;
  getStreamConversation?: Function;
  activeConversation?: any;
}
class StreamMessenger extends PureComponent<IProps> {
  render() {
    const { activeConversation, loggedIn } = this.props;
    return (
      <div className="message-stream">
        {activeConversation && activeConversation.data && activeConversation.data.streamId ? <MessageList loggedIn={loggedIn} /> : <p>No conversation found.</p>}
      </div>
    );
  }
}
const mapStates = (state: any) => ({
  activeConversation: state.streamMessage.activeConversation
});
const mapDispatchs = { getStreamConversation };
export default connect(mapStates, mapDispatchs)(StreamMessenger);
