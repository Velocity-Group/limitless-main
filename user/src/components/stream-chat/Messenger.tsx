import { PureComponent } from 'react';
import MessageList from './MessageList';
import '@components/messages/Messenger.less';

interface IProps {
  streamId?: string;
}
export default class StreamMessenger extends PureComponent<IProps> {
  render() {
    const { streamId } = this.props;
    return (
      <div className="message-stream">
        {streamId ? <MessageList /> : <p>Let&apos;s start a conversation</p>}
      </div>
    );
  }
}
