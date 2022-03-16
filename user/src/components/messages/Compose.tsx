import { PureComponent, createRef } from 'react';
import { connect } from 'react-redux';
import {
  Modal, message, Popover
} from 'antd';
import { sendMessage, sentFileSuccess } from '@redux/message/actions';
import { SmileOutlined, SendOutlined } from '@ant-design/icons';
import { ImageMessageUpload } from '@components/messages/uploadPhoto';
import { authService, messageService, tokenTransctionService } from '@services/index';
import { TipPerformerForm } from '@components/performer/tip-form';
import { IUIConfig } from 'src/interfaces';
import { updateBalance } from '@redux/user/actions';
import Router from 'next/router';
import { Emotions } from './emotions';
import './Compose.less';

interface IProps {
  ui: IUIConfig;
  updateBalance: Function;
  sendMessage: Function;
  sentFileSuccess: Function;
  sendMessageStatus: any;
  conversation: any;
  currentUser: any;
  disabled?: boolean;
}

class Compose extends PureComponent<IProps> {
  _input: any;

  state = {
    text: '', openTipModal: false, submiting: false
  };

  componentDidMount() {
    if (!this._input) this._input = createRef();
  }

  componentDidUpdate(previousProps) {
    const { sendMessageStatus } = this.props;
    if (previousProps?.sendMessageStatus?.success !== sendMessageStatus?.success && sendMessageStatus?.success) {
      // eslint-disable-next-line react/no-did-update-set-state
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

  onEmojiClick = (emoji) => {
    const { text } = this.state;
    const { disabled } = this.props;
    if (disabled) return;
    this.setState({ text: `${text} ${emoji} ` });
  }

  onPhotoUploaded = (data: any) => {
    const { sentFileSuccess: handleSendFile } = this.props;
    if (!data || !data.response) {
      return;
    }
    const imageUrl = data.response.data && data.response.data.imageUrl;
    handleSendFile({ ...data.response.data, ...{ imageUrl } });
  }

  send() {
    const { text } = this.state;
    const { disabled, sendMessage: handleSendMessage } = this.props;
    if (!text || disabled) return;
    const { conversation } = this.props;
    handleSendMessage({
      conversationId: conversation._id,
      data: { text }
    });
  }

  async sendTip(price) {
    const { currentUser, conversation, updateBalance: handleUpdateBalance } = this.props;
    if (currentUser.balance < price) {
      message.error('Your token balance is not enough');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransctionService.sendTip(conversation?.recipientInfo?._id, { conversationId: conversation?._id, price });
      message.success('Thank you for the tip');
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openTipModal: false });
    }
  }

  render() {
    const {
      disabled, sendMessageStatus: status, conversation, currentUser, ui
    } = this.props;
    const {
      text, openTipModal, submiting
    } = this.state;
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
          disabled={disabled || status.sending || !conversation._id}
          ref={(c) => { this._input = c; }}
        />
        <Popover className="emotion-popover" content={<Emotions onEmojiClick={this.onEmojiClick.bind(this)} siteName={ui?.siteName} />} trigger="click">
          <div className="grp-icons">
            <SmileOutlined />
          </div>
        </Popover>
        {/* <div className="grp-icons">
          <div aria-hidden className="grp-emotions" onClick={() => this.setState({ openTipModal: true })}>
            <DollarOutlined />
          </div>
        </div> */}
        <div className="grp-icons">
          <div className="grp-file-icon">
            <ImageMessageUpload
              disabled={disabled}
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
          <div aria-hidden className="grp-send" onClick={this.send.bind(this)}>
            <SendOutlined />
          </div>
        </div>
        <Modal
          key="tip_performer"
          className="subscription-modal"
          title={null}
          width={350}
          visible={openTipModal}
          onOk={() => this.setState({ openTipModal: false })}
          footer={null}
          onCancel={() => this.setState({ openTipModal: false })}
        >
          <TipPerformerForm performer={conversation.recipientInfo} submiting={submiting} onFinish={this.sendTip.bind(this)} />
        </Modal>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  sendMessageStatus: state.message.sendMessage,
  currentUser: state.user.current,
  ui: state.ui
});

const mapDispatch = { sendMessage, sentFileSuccess, updateBalance };
export default connect(mapStates, mapDispatch)(Compose);
