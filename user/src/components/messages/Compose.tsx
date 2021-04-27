/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-did-update-set-state */
import { PureComponent, createRef } from 'react';
import { connect } from 'react-redux';
import { sendMessage, sentFileSuccess } from '@redux/message/actions';
import { SmileOutlined, SendOutlined } from '@ant-design/icons';
import { ImageMessageUpload } from '@components/messages/uploadPhoto';
import { authService, messageService } from '@services/index';
import { Emotions } from './emotions';
import './Compose.less';

interface IProps {
  sendMessage: Function;
  sentFileSuccess: Function;
  sendMessageStatus: any;
  conversation: any;
  currentUser: any
}

class Compose extends PureComponent<IProps> {
  _input: any;

  state = { text: '' };

  componentDidMount() {
    if (!this._input) this._input = createRef();
  }

  componentDidUpdate(previousProps) {
    const { sendMessageStatus } = this.props;
    if (previousProps.sendMessageStatus.success !== sendMessageStatus.success) {
      this.setState({ text: '' });
      this._input && this._input.focus();
    }
  }

  onKeyDown = (evt) => {
    if (evt.keyCode === 13) {
      this.send();
    }
  };

  onChange = (evt) => {
    this.setState({ text: evt.target.value });
  };

  onEmojiClick = (emojiObject) => {
    const { text } = this.state;
    this.setState({ text: text + emojiObject.emoji });
  }

  onPhotoUploaded = (data: any) => {
    if (!data || !data.response) {
      return;
    }
    const imageUrl = (data.response.data && data.response.data.imageUrl) || data.base64;
    this.props.sentFileSuccess({ ...data.response.data, ...{ imageUrl } });
  }

  send() {
    if (!this.state.text) return;
    const { conversation } = this.props;
    this.props.sendMessage({
      conversationId: conversation._id,
      data: {
        text: this.state.text
      }
    });
  }

  render() {
    const { text } = this.state;
    const { sendMessageStatus: status, conversation, currentUser } = this.props;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    if (!this._input) this._input = createRef();
    return (
      <div className="compose">
        <textarea
          value={text}
          className="compose-input"
          placeholder="Write your message..."
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          disabled={status.sending || !conversation._id}
          autoFocus
          ref={(c) => { this._input = c; }}
        />
        <div className="grp-icons">
          <div className="grp-emotions">
            <SmileOutlined />
            <Emotions onEmojiClick={this.onEmojiClick.bind(this)} />
          </div>
        </div>

        <div className="grp-icons">
          <div className="grp-file-icon">
            <ImageMessageUpload
              headers={uploadHeaders}
              uploadUrl={messageService.getMessageUploadUrl()}
              onUploaded={this.onPhotoUploaded}
              options={{ fieldName: 'message-photo' }}
              messageData={{
                text: 'sent a photo',
                conversationId: conversation && conversation._id,
                recipientId: conversation && conversation.recipientInfo && conversation.recipientInfo._id,
                recipientType: currentUser && currentUser.isPerformer ? 'user' : 'performer'
              }}
            />
          </div>
        </div>
        <div className="grp-icons" style={{ paddingRight: 0 }}>
          <div className="grp-send" onClick={this.send.bind(this)}>
            <SendOutlined />
          </div>
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  sendMessageStatus: state.message.sendMessage,
  currentUser: state.user.current
});

const mapDispatch = { sendMessage, sentFileSuccess };
export default connect(mapStates, mapDispatch)(Compose);
