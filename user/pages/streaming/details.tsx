/* eslint-disable dot-notation */
import { PureComponent, createRef, forwardRef } from 'react';
import Head from 'next/head';
import {
  Layout, Row, Col, message, Button, Modal, Card
} from 'antd';
import { ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { IResponse } from 'src/services/api-request';
import {
  IPerformer,
  IUser,
  StreamSettings,
  IUIConfig,
  IStream
} from 'src/interfaces';
import { connect } from 'react-redux';
import {
  streamService,
  performerService,
  messageService,
  tokenTransctionService
} from 'src/services';
import { SocketContext, Event } from 'src/socket';
import nextCookie from 'next-cookies';
import Router from 'next/router';
import ChatBox from '@components/stream-chat/chat-box';
import { updateBalance } from '@redux/user/actions';
import {
  loadStreamMessages,
  getStreamConversationSuccess,
  getStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { getResponseError, videoDuration } from '@lib/index';
import { PurchaseStreamForm } from '@components/streaming/confirm-purchase';
import { TipPerformerForm } from '@components/performer';
import dynamic from 'next/dynamic';
import '../model/live/index.less';
import { SubscriberProps } from '@components/streaming/agora/subscriber';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), {
  ssr: false
});
const Subscriber = dynamic(
  () => import('@components/streaming/agora/subscriber'),
  { ssr: false }
);
const ForwardedSubscriber = forwardRef((props: SubscriberProps, ref) => (
  <Subscriber {...props} forwardedRef={ref} />
));

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOIN_BROADCASTER = 'join-broadcaster',
  MODEL_LEFT = 'model-left',
  ROOM_INFORMATIOM_CHANGED = 'public-room-changed',
}

interface IProps {
  updateBalance: Function;
  resetStreamMessage: Function;
  getStreamConversationSuccess: Function;
  loadStreamMessages: Function;
  getStreamConversation: Function;
  activeConversation: any;
  ui: IUIConfig;
  user: IUser;
  performer: IPerformer;
  stream: IStream;
  settings: StreamSettings;
}

class LivePage extends PureComponent<IProps> {
  static layout = 'stream';

  static authenticate = true;

  private subscriberRef = createRef<{ join: any; unsubscribe: any }>();

  private streamDurationTimeOut: any;

  static async getInitialProps({ ctx }) {
    try {
      const { query } = ctx;
      const { token } = nextCookie(ctx);
      const headers = { Authorization: token };
      const resp: IResponse<IPerformer> = await performerService.findOne(
        query.username,
        headers
      );

      const stream = await streamService.joinPublicChat(resp.data._id, headers);
      return {
        performer: resp.data,
        stream: stream.data
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
    sessionDuration: 0,
    openPurchaseModal: false,
    submiting: false,
    openTipModal: false,
    initialized: false
  };

  componentDidMount() {
    const { performer, user } = this.props;
    if (!performer || user.isPerformer) {
      Router.back();
      return;
    }
    if (!performer.isSubscribed) {
      message.error('Please subscribe to join live chat!', 5);
      Router.push(
        {
          pathname: '/model/profile',
          query: { username: performer?.username || performer?._id }
        },
        `/${performer?.username || performer?._id}`
      );
      return;
    }

    this.joinConversation();

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
    this.streamDurationTimeOut = setTimeout(
      this.handleDuration.bind(this),
      1000
    );
  }

  onStreamStatusChange = (streaming: boolean) => {
    if (!streaming) {
      this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    } else {
      this.setState({ initialized: true });
      !this.streamDurationTimeOut && this.handleDuration();
    }
  };

  onbeforeunload = () => {
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.leavePublicRoom();
  };

  onChangeMembers({ total, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({ total });
    }
  }

  async purchaseStream() {
    const { stream: activeStream } = this.props;
    const { user, updateBalance: handleUpdateBalance } = this.props;
    if (activeStream.isFree || !activeStream.sessionId) return;
    if (user.balance < activeStream.price) {
      message.error(
        'You have an insufficient token balance. Please top up.',
        15
      );
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

  retryJoin(n: number) {
    if (n === 0) return;

    if (!this.subscriberRef.current) {
      setTimeout(() => this.retryJoin(n - 1), 3000);
      return;
    }

    this.subscriberRef.current.join();
  }

  async subscribeStream({ performerId, conversationId }) {
    const { initialized } = this.state;
    const { activeConversation } = this.props;

    if (activeConversation?.data?._id !== conversationId) return;

    try {
      const resp = await streamService.joinPublicChat(performerId);
      const { streamingTime } = resp.data;
      this.setState({ sessionDuration: streamingTime || 0 });

      !initialized && this.retryJoin(3);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  async joinConversation(purchased = false) {
    const {
      performer,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess,
      getStreamConversation: dispatchGetStreamConversation,
      stream
    } = this.props;

    const socket = this.context;

    try {
      if (!purchased) {
        if (!stream.isFree && !stream.hasPurchased) {
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
        dispatchGetStreamConversation({
          conversation
        });
        socket
          && socket.emit('public-stream/join', {
            conversationId: conversation._id
          });
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

  modelLeftHandler({ conversationId, performerId }) {
    const { performer, activeConversation } = this.props;
    if (
      activeConversation?.data?._id !== conversationId
      || performer?._id !== performerId
    ) {
      return;
    }

    this.setState({ sessionDuration: 0 });
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    message.info('Streaming session ended! Redirecting after 10s', 10);
    setTimeout(() => {
      Router.push(
        {
          pathname: '/model/profile',
          query: { username: performer?.username || performer?._id }
        },
        `/${performer?.username || performer?._id}`
      );
    }, 10 * 1000);
  }

  async sendTip(token) {
    const {
      performer,
      user,
      updateBalance: handleUpdateBalance,
      activeConversation
    } = this.props;
    const { stream: activeStream } = this.props;
    if (user.balance < token) {
      message.error('You have an insufficient token balance. Please top up.');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransctionService.sendTip(performer?._id, {
        price: token,
        conversationId: activeConversation?.data?._id,
        sessionId: activeStream?.sessionId,
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
      performer, user, ui, stream: activeStream
    } = this.props;
    const {
      total,
      openPurchaseModal,
      sessionDuration,
      submiting,
      openTipModal
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName || ''} | ${
              performer?.name || performer?.username
            } Broadcast`}
          </title>
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
        <AgoraProvider
          config={{ codec: 'h264', mode: 'live', role: 'audience' }}
        >
          <div>
            <Row className="main-container">
              <Col md={16} xs={24}>
                <div className="stream-video">
                  <ForwardedSubscriber
                    localUId={user?._id}
                    remoteUId={performer?._id}
                    ref={this.subscriberRef}
                    sessionId={activeStream?.sessionId}
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
                  <span>
                    <EyeOutlined />
                    {' '}
                    {total}
                  </span>
                </div>
                <Row>
                  <Col lg={16} xs={24}>
                    <Card bordered={false} bodyStyle={{ padding: 0 }}>
                      <Card.Meta
                        title={
                          activeStream?.title
                          || `${performer?.name || performer?.username} Live`
                        }
                        description={
                          activeStream?.description || 'No description'
                        }
                      />
                    </Card>
                  </Col>
                  <Col lg={8} xs={24}>
                    <div>
                      <Button
                        block
                        className="primary"
                        onClick={() => Router.push(
                          {
                            pathname: '/model/profile',
                            query: {
                              username: performer?.username || performer?._id
                            }
                          },
                          `/${performer?.username || performer?._id}`
                        )}
                      >
                        Leave Chat
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
                  </Col>
                </Row>
              </Col>
              <Col md={8} xs={24}>
                <ChatBox {...this.props} />
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
              <TipPerformerForm
                performer={performer}
                submiting={submiting}
                onFinish={this.sendTip.bind(this)}
              />
            </Modal>
            <Modal
              centered
              key="confirm_join_stream"
              title={`Join ${
                performer?.name || performer?.username || 'N/A'
              } live chat`}
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
        </AgoraProvider>
      </Layout>
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
  resetStreamMessage,
  getStreamConversation
};
export default connect(mapStateToProps, mapDispatch)(LivePage);
