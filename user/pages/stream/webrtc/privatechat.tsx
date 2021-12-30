import { PureComponent, createRef } from 'react';
import Header from 'next/head';
import {
  Row, Col, message, Button, Modal, Spin, Layout
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import Router, { Router as RouterEvent } from 'next/router';
import {
  IPerformer, IUIConfig, IUser, StreamSettings
} from 'src/interfaces';
import {
  performerService, purchaseTokenService, streamService
} from 'src/services';
import { connect } from 'react-redux';
import {
  getStreamConversationSuccess,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateBalance } from '@redux/user/actions';
import { SocketContext, Event } from 'src/socket';
import nextCookie from 'next-cookies';
import ChatBox from '@components/stream-chat/chat-box';
import { getResponseError, videoDuration } from '@lib/index';
import PrivatePublisher from 'src/components/streaming/webrtc/privatechat/publisher';
import PrivateSubscriber from 'src/components/streaming/webrtc/privatechat/subscriber';
import { PurchaseStreamForm } from '@components/streaming/confirm-purchase';
import { TipPerformerForm } from '@components/performer/tip-form';
import '../../model/live/index.less';
// eslint-disable-next-line no-shadow
enum EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  PRIVATE_CHAT_DECLINE = 'private-chat-decline',
  PRIVATE_CHAT_ACCEPT = 'private-chat-accept'
}

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEAVED = 'private-stream/streamLeaved';
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';

interface IProps {
  ui: IUIConfig;
  username: string;
  performer: IPerformer;
  user: IUser;
  getStreamConversationSuccess: Function;
  activeConversation: any;
  resetStreamMessage: Function;
  updateBalance: Function;
  settings: StreamSettings;
}

interface IStates {
  roomJoined: boolean;
  processing: boolean;
  total: number;
  members: IUser[];
  callTime: number;
  openPriceModal: boolean;
  countTime: number;
  openTipModal: boolean;
}

class UserPrivateChat extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  private publisherRef;

  private subscriberRef;

  private streamId: string;

  private socket;

  private _intervalCallTime;

  private _intervalCountdown;

  private intervalCharge;

  private requestSession: any;

  static async getInitialProps({ ctx }) {
    try {
      const { query } = ctx;
      if (process.browser && query.performer) {
        return {
          performer: JSON.parse(query.performer)
        };
      }

      const { token } = nextCookie(ctx);
      const headers = { Authorization: token };
      const resp = await performerService.findOne(query.username, headers);
      const performer: IPerformer = resp.data;
      return {
        performer
      };
    } catch (e) {
      if (process.browser) {
        return Router.back();
      }

      ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/home' });
      ctx.res.end && ctx.res.end();
      return {};
    }
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      openPriceModal: false,
      openTipModal: false,
      processing: false,
      roomJoined: false,
      total: 0,
      callTime: 0,
      members: [],
      countTime: 300
    };
  }

  componentDidMount() {
    const { performer } = this.props;
    if (!performer.isOnline) {
      message.error(`${performer?.name || performer?.username} is offline!`);
      Router.back();
      return;
    }
    if (!this.publisherRef) {
      this.publisherRef = createRef();
    }
    if (!this.subscriberRef) {
      this.subscriberRef = createRef();
    }
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload.bind(this));
  }

  componentDidUpdate(prevProps: IProps, prevState: IStates) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id !== prevProps.activeConversation?.data?._id) {
      this.initSocketEvent();
    }
    if (prevState.countTime === 0) {
      this._intervalCountdown && clearInterval(this._intervalCountdown);
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ countTime: 60 });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  onbeforeunload = () => {
    this.leaveSession();
  };

  async onCancelRequest() {
    if (!window.confirm('Cancel call request?')) return;
    try {
      const { conversation } = this.requestSession;
      conversation && await streamService.declinePrivateChat(conversation._id);
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
    } finally {
      Router.back();
    }
  }

  handleCountdown = () => {
    const { countTime } = this.state;
    if (countTime === 0) {
      clearInterval(this._intervalCountdown);
      this.setState({ countTime: 300 });
      return;
    }
    this.setState({ countTime: countTime - 1 });
    this._intervalCountdown = setInterval(this.countdown.bind(this), 1000);
  }

  async purchaseStream() {
    const {
      performer, user, updateBalance: handleUpdateBalance, activeConversation
    } = this.props;
    if (!activeConversation?.data?.streamId) return;
    if (user.balance < performer.privateChatPrice) {
      message.error('You have an insufficient token balance. Please top up.', 15);
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ processing: true });
      await purchaseTokenService.purchaseStream(activeConversation?.data?.streamId);
      handleUpdateBalance({ token: -performer.privateChatPrice });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later');
      Router.back();
    } finally {
      this.setState({ processing: false });
    }
  }

  initSocketEvent() {
    this.socket = this.context;
    this.socket.on(
      JOINED_THE_ROOM,
      ({ streamId, conversationId }) => {
        this.streamId = streamId;
        const { activeConversation } = this.props;
        if (conversationId !== activeConversation.data._id) return;
        conversationId && this.publisherRef.current && this.publisherRef.current.start(conversationId);
        streamId && this.publisherRef.current && this.publisherRef.current.publish(streamId);
      }
    );
    this.socket.on(STREAM_JOINED, ({ streamId, conversationId }) => {
      const { activeConversation } = this.props;
      if (conversationId !== activeConversation.data._id) return;
      if (this.streamId !== streamId) {
        this.subscriberRef.current && this.subscriberRef.current.play(streamId);
        this._intervalCountdown && clearInterval(this._intervalCountdown);
        this._intervalCallTime = setInterval(() => {
          const { callTime } = this.state;
          this.setState({ callTime: callTime + 1 });
        }, 1000);
        this.purchaseStream();
        this.intervalCharge = setInterval(this.purchaseStream.bind(this), 60 * 1000);
      }
    });
    this.socket.on(STREAM_LEAVED, ({ conversationId }) => {
      const { performer, activeConversation } = this.props;
      if (conversationId !== activeConversation?.data?._id) return;
      message.info('Call ended!', 10);
      setTimeout(() => { Router.replace({ pathname: '/model/profile', query: { username: performer?.username || performer?._id } }, `/${performer?.username || performer?._id}`); }, 5000);
    });
  }

  async sendRequest(payload: any) {
    const { performer, getStreamConversationSuccess: dispatchGetStreamConversationSuccess } = this.props;
    try {
      await this.setState({ processing: true });
      const resp = await (await streamService.requestPrivateChat(performer._id, { userNote: payload.userNote || '' })).data;
      message.success(`Requested a Private call to ${performer?.name || performer?.username}!`);
      const socket = this.context;
      socket && resp.conversation && socket.emit(EVENT.JOIN_ROOM, {
        conversationId: resp.conversation._id
      });
      this.handleCountdown();
      this.requestSession = resp;
      dispatchGetStreamConversationSuccess({
        data: resp.conversation
      });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ processing: false, openPriceModal: false });
    }
  }

  leaveSession() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage
    } = this.props;
    const socket = this.context;
    dispatchResetStreamMessage();
    this.socket && this.socket.off(JOINED_THE_ROOM);
    this.socket && this.socket.off(STREAM_JOINED);
    this.socket && this.socket.off(STREAM_LEAVED);
    if (socket && activeConversation && activeConversation.data) {
      socket.emit(EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
      });
    }
    this._intervalCallTime && clearInterval(this._intervalCallTime);
    this._intervalCountdown && clearInterval(this._intervalCountdown);
    this.intervalCharge && clearInterval(this.intervalCharge);
  }

  async acceptRequest(data) {
    const { performer } = this.props;
    const { conversation } = data;
    const { conversation: requestConversation } = this.requestSession;
    if (!conversation || !conversation._id || conversation?.type !== 'stream_private' || requestConversation?._id !== conversation?._id) {
      message.error('An error occured, please try again later');
      Router.back();
      return;
    }
    message.success(`${performer?.name || performer?.username} accepted your call request, start calling right now`);
    this.setState({ countTime: 300, roomJoined: true });
  }

  countdown() {
    const { countTime } = this.state;
    this.setState({ countTime: countTime - 1 });
  }

  async declineRequest(data) {
    const { activeConversation } = this.props;
    const { conversationId } = data;
    if (activeConversation.data && activeConversation.data._id !== conversationId) return;
    message.error('Your call request has been declined, please try a new one!');
    this._intervalCountdown && clearInterval(this._intervalCountdown);
    this.setState({ countTime: 300 });
  }

  async sendTip(token) {
    const {
      performer, user, updateBalance: handleUpdateBalance, activeConversation
    } = this.props;
    if (!activeConversation || !activeConversation.data || !activeConversation.data._id) return;
    if (user.balance < token) {
      message.error('You have an insufficient token balance. Please top up.');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ processing: true });
      await purchaseTokenService.sendTip(performer?._id, { token, conversationId: activeConversation.data._id, streamType: 'stream_private' });
      message.success('Thank you for the tip!');
      handleUpdateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ processing: false, openTipModal: false });
    }
  }

  render() {
    const {
      processing, total, members, roomJoined, callTime, openPriceModal,
      countTime, openTipModal
    } = this.state;
    const { ui, performer, user } = this.props;
    return (
      <Layout>
        <Header>
          <title>{`${ui?.siteName} | Private call with ${performer?.name || performer?.username || 'N/A'}`}</title>
        </Header>
        <Event
          event={EVENT.PRIVATE_CHAT_DECLINE}
          handler={this.declineRequest.bind(this)}
        />
        <Event
          event={EVENT.PRIVATE_CHAT_ACCEPT}
          handler={this.acceptRequest.bind(this)}
        />
        <div className="container">
          <Row>
            <Col md={14} xs={24}>
              <div className={!roomJoined ? 'hide private-streaming-container' : 'private-streaming-container'}>
                <PrivatePublisher
                  {...this.props}
                  // eslint-disable-next-line no-return-assign
                  ref={this.publisherRef}
                  configs={{
                    localVideoId: 'private-publisher'
                  }}
                />
                <PrivateSubscriber
                  {...this.props}
                  ref={this.subscriberRef}
                  configs={{
                    isPlayMode: true
                  }}
                />
              </div>
              {!roomJoined && <img alt="img" src="/static/offline.jpg" width="100%" style={{ margin: '5px 0' }} />}
              <p className="stream-duration">
                <span>
                  <ClockCircleOutlined />
                  {' '}
                  {videoDuration(callTime)}
                </span>
                <span>
                  <img src="/static/gem-ico.png" alt="gem" width="20px" />
                  {' '}
                  {(user?.balance || 0).toFixed(2)}
                </span>
              </p>
              {!roomJoined && (countTime < 300) && [
                <h4 key="text_1" className="text-center">{`Your request has been sent, please waiting for ${performer?.name || performer?.username || 'N/A'} accept!`}</h4>,
                <div key="text_2" className="text-center"><Spin size="large" /></div>]}
              {!roomJoined ? (
                <Button
                  type="primary"
                  onClick={() => this.setState({ openPriceModal: true })}
                  loading={processing || countTime < 300}
                  block
                  disabled={processing || countTime < 300}
                >
                  {countTime < 300 ? `Re-send in ${videoDuration(countTime)}` : (
                    <a>
                      Request a Private Call to
                      {' '}
                      {performer?.name || performer?.username || 'N/A'}
                      {' '}
                      by
                      {' '}
                      <img src="/static/gem-ico.png" width="20px" alt="gem" />
                      {' '}
                      {(performer?.privateChatPrice || 0).toFixed(2)}
                      {' '}
                      per minute
                    </a>
                  )}
                </Button>
              ) : (
                <div style={{ display: 'flex' }}>
                  <Button
                    className="error"
                    onClick={() => Router.back()}
                    block
                    disabled={processing}
                  >
                    End Call
                  </Button>
                  <Button
                    className="secondary"
                    onClick={() => this.setState({ openTipModal: true })}
                    block
                    disabled={processing}
                  >
                    Send Tip
                  </Button>
                </div>
              )}
            </Col>
            <Col xs={24} md={10}>
              <ChatBox
                {...this.props}
                totalParticipant={total}
                members={members}
                hideMember
              />
            </Col>
          </Row>
          <Modal
            centered
            key="update_stream"
            title="Send Private Call Request"
            visible={openPriceModal}
            footer={null}
            onCancel={() => this.setState({ openPriceModal: false })}
          >
            <PurchaseStreamForm streamType="private" submiting={processing} performer={performer} onFinish={this.sendRequest.bind(this)} />
          </Modal>
          <Modal
            centered
            key="tip"
            title={null}
            visible={openTipModal}
            onOk={() => this.setState({ openTipModal: false })}
            confirmLoading={processing}
            footer={null}
            onCancel={() => this.setState({ openTipModal: false })}
            destroyOnClose
          >
            <TipPerformerForm performer={performer} submiting={processing} onFinish={this.sendTip.bind(this)} />
          </Modal>
        </div>
      </Layout>
    );
  }
}

UserPrivateChat.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: state.ui,
  ...state.streaming,
  user: { ...state.user.current },
  activeConversation: state.streamMessage.activeConversation
});
const mapDispatchs = {
  getStreamConversationSuccess,
  resetStreamMessage,
  updateBalance
};
export default connect(
  mapStateToProps,
  mapDispatchs
)(UserPrivateChat);
