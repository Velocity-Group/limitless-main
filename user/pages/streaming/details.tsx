/* eslint-disable dot-notation */
import { PureComponent, createRef, forwardRef } from 'react';
import Head from 'next/head';
import {
  Layout, Row, Col, message, Button, Alert, Modal
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { IResponse } from 'src/services/api-request';
import {
  IPerformer, IUser, StreamSettings, IUIConfig, IStream
} from 'src/interfaces';
import { connect } from 'react-redux';
import {
  streamService, performerService, messageService, tokenTransctionService
} from 'src/services';
import { SocketContext, Event } from 'src/socket';
import nextCookie from 'next-cookies';
import Router from 'next/router';
import ChatBox from '@components/stream-chat/chat-box';
import { updateBalance } from '@redux/user/actions';
import {
  loadStreamMessages, getStreamConversationSuccess, resetStreamMessage
} from '@redux/stream-chat/actions';
import { getResponseError, videoDuration } from '@lib/index';
import { PurchaseStreamForm } from '@components/streaming/confirm-purchase';
import { TipPerformerForm } from '@components/performer';
import dynamic from 'next/dynamic';
import '../model/live/index.less';
import { SubscriberProps } from '@components/streaming/agora/subscriber';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), { ssr: false });
const Subscriber = dynamic(() => import('@components/streaming/agora/subscriber'), { ssr: false });
const ForwardedSubscriber = forwardRef((props: SubscriberProps, ref) => <Subscriber {...props} forwardedRef={ref} />);

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOIN_BROADCASTER = 'join-broadcaster',
  MODEL_LEFT = 'model-left',
  ROOM_INFORMATIOM_CHANGED = 'public-room-changed'
}

interface IProps {
  updateBalance: Function;
  resetStreamMessage: Function;
  getStreamConversationSuccess: Function;
  loadStreamMessages: Function;
  activeConversation: any;
  ui: IUIConfig;
  user: IUser;
  performer: IPerformer;
  settings: StreamSettings;
}

class LivePage extends PureComponent<IProps> {
  static layout = 'stream';

  static authenticate = true;

  private subscriberRef = createRef<{join: any, unsubscribe: any}>();

  private streamDurationTimeOut: any;

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
      const resp: IResponse<IPerformer> = await performerService.findOne(
        query.username,
        headers
      );
      return {
        performer: resp.data
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

  state = {
    total: 0,
    members: [],
    sessionDuration: 0,
    openPurchaseModal: false,
    submiting: false,
    openTipModal: false,
    initialized: false,
    activeStream: null as IStream
  };

  componentDidMount() {
    const { performer, user } = this.props;
    if (!performer || user.isPerformer) {
      Router.back();
      return;
    }
    if (!performer.isSubscribed) {
      message.error('Please subscribe to join live chat!', 5);
      Router.push({ pathname: '/model/profile', query: { username: performer?.username || performer?._id } }, `/${performer?.username || performer?._id}`);
      return;
    }
    Router.events.on('routeChangeStart', this.onbeforeunload.bind(this));
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    Router.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  // eslint-disable-next-line react/sort-comp
  handleDuration() {
    const { sessionDuration } = this.state;
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.setState({ sessionDuration: sessionDuration + 1 });
    this.streamDurationTimeOut = setTimeout(this.handleDuration.bind(this), 1000);
  }

  onStreamStatusChange = (streaming: boolean) => {
    if (!streaming) {
      this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    } else {
      this.setState({ initialized: true });
      !this.streamDurationTimeOut && this.handleDuration();
    }
  }

  onbeforeunload = () => {
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.leavePublicRoom();
  };

  onChangeMembers({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({ total, members });
    }
  }

  async purchaseStream() {
    const {
      activeStream
    } = this.state;
    const { user, updateBalance: handleUpdateBalance } = this.props;
    if (activeStream.isFree || !activeStream.sessionId) return;
    if (user.balance < activeStream.price) {
      message.error('You have an insufficient token balance. Please top up.', 15);
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransctionService.purchaseStream(activeStream._id);
      handleUpdateBalance({ token: -activeStream.price });
      await this.joinConversation(true);
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  confirmJoinStream() {
    this.purchaseStream();
    this.setState({ openPurchaseModal: false });
  }

  async subscribeStream({ performerId }) {
    const { initialized } = this.state;
    try {
      const resp = await streamService.joinPublicChat(performerId);
      const { streamingTime } = resp.data;
      this.setState({ activeStream: resp.data, sessionDuration: streamingTime || 0 });
      !initialized && this.subscriberRef.current && this.subscriberRef.current.join();
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  async joinConversation(purchased = false) {
    const {
      performer, loadStreamMessages: dispatchLoadStreamMessages,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess
    } = this.props;
    const socket = this.context;

    try {
      if (!purchased) {
        const { data } = await streamService.joinPublicChat(performer._id);
        const { isFree } = data;
        if (!isFree) {
          this.setState({ openPurchaseModal: true });
          return;
        }
      }
      const resp = await messageService.findPublicConversationPerformer(
        performer._id
      );
      const conversation = resp.data;
      if (conversation && conversation._id) {
        dispatchGetStreamConversationSuccess({ data: conversation });
        dispatchLoadStreamMessages({
          conversationId: conversation._id,
          limit: 25,
          offset: 0,
          type: conversation.type
        });
        socket && socket.emit('public-stream/join', { conversationId: conversation._id });
      } else {
        message.info('No available stream. Try again later');
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  leavePublicRoom() {
    const socket = this.context;
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage
    } = this.props;
    dispatchResetStreamMessage();
    if (socket && activeConversation?.data?._id) {
      socket.emit('public-stream/leave', {
        conversationId: activeConversation?.data?._id
      });
    }
  }

  modelLeftHandler() {
    this.setState({ sessionDuration: 0 });
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    message.info('Streaming session ended! Redirecting after 10s', 10);
    setTimeout(() => { Router.push('/live-chat'); }, 10);
  }

  async sendTip(token) {
    const {
      performer, user, updateBalance: handleUpdateBalance, activeConversation
    } = this.props;
    const { activeStream } = this.state;
    if (user.balance < token) {
      message.error('You have an insufficient token balance. Please top up.');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransctionService.sendTip(performer?._id, {
        price: token,
        conversationId: activeConversation.data._id,
        sessionId: activeStream.sessionId,
        streamType: 'stream_public'
      });
      message.success('Thank you for the tip!');
      handleUpdateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openTipModal: false });
    }
  }

  render() {
    const {
      performer, user, ui, activeConversation
    } = this.props;
    const {
      members, total, openPurchaseModal,
      sessionDuration, submiting, openTipModal, activeStream
    } = this.state;
    return (
      <AgoraProvider config={{ codec: 'h264', mode: 'live', role: 'audience' }}>
        <Layout>
          <Head>
            <title>{`${ui?.siteName || ''} | ${performer?.name || performer?.username} Broadcast`}</title>
          </Head>
          <Event
            event={STREAM_EVENT.JOIN_BROADCASTER}
            handler={this.subscribeStream.bind(this)}
          />
          <Event
            event={STREAM_EVENT.MODEL_LEFT}
            handler={this.modelLeftHandler.bind(this)}
          />
          <Event
            event={STREAM_EVENT.ROOM_INFORMATIOM_CHANGED}
            handler={this.onChangeMembers.bind(this)}
          />
          <div>
            <Row className="streaming-container">
              <Col md={16} xs={24}>
                <Alert style={{ margin: '0 0 10px', textAlign: 'center' }} type="info" message={activeStream?.title || `${performer?.name || performer?.username} Live`} />
                <div className="stream-video">
                  <ForwardedSubscriber
                    localUId={user?._id}
                    remoteUId={performer?._id}
                    ref={this.subscriberRef}
                    conversationId={activeConversation?.data?._id}
                    onStreamStatusChange={(val) => this.onStreamStatusChange(val)}
                  />
                </div>
                <div className="stream-duration">
                  <span style={{ marginRight: 5 }}>
                    <ClockCircleOutlined />
                    {' '}
                    {videoDuration(sessionDuration)}
                  </span>
                  <span>
                    <img src="/static/coin-ico.png" alt="gem" width="20px" />
                    {' '}
                    {(user?.balance || 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ margin: 10, display: 'flex' }}>
                  <Button
                    block
                    className="primary"
                    onClick={this.joinConversation.bind(this)}
                  >
                    Join Chat
                  </Button>
                  <Button
                    block
                    className="secondary"
                    disabled={submiting}
                    onClick={() => this.setState({ openTipModal: true })}
                  >
                    Send Tip
                  </Button>
                </div>
                <p>{activeStream?.description || 'No description'}</p>
              </Col>
              <Col md={8} xs={24}>
                <ChatBox
                  {...this.props}
                  members={members}
                  totalParticipant={total}
                />
              </Col>
            </Row>
            <Modal
              key="tip"
              centered
              title={null}
              visible={openTipModal}
              onOk={() => this.setState({ openTipModal: false })}
              footer={null}
              onCancel={() => this.setState({ openTipModal: false })}
            >
              <TipPerformerForm performer={performer} submiting={submiting} onFinish={this.sendTip.bind(this)} />
            </Modal>
            <Modal
              centered
              key="confirm_join_stream"
              title={`Join ${performer?.name || performer?.username || 'N/A'} live chat`}
              visible={openPurchaseModal}
              footer={null}
              destroyOnClose
              closable={false}
              maskClosable={false}
              onCancel={() => Router.back()}
            >
              <PurchaseStreamForm
                submiting={submiting}
                performer={performer}
                activeStream={activeStream}
                onFinish={this.confirmJoinStream.bind(this)}
              />
            </Modal>
          </div>
        </Layout>
      </AgoraProvider>
    );
  }
}

LivePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  ...state.streaming,
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation }
});
const mapDispatch = {
  updateBalance,
  loadStreamMessages,
  getStreamConversationSuccess,
  resetStreamMessage
};
export default connect(mapStateToProps, mapDispatch)(LivePage);
