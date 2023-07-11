/* eslint-disable dot-notation */
import { PureComponent, createRef, forwardRef } from 'react';
import Head from 'next/head';
import {
  Layout, Row, Col, message, Button, Modal, List
} from 'antd';
import {
  IPerformer,
  IUser,
  StreamSettings,
  IUIConfig,
  IStream,
  IConversation
} from 'src/interfaces';
import { connect } from 'react-redux';
import {
  tokenTransactionService,
  streamRequestService
} from 'src/services';
import { SocketContext, Event } from 'src/socket';
import Router from 'next/router';
import ChatBox from '@components/stream-chat/chat-box';
import { updateBalance } from '@redux/user/actions';
import {
  loadStreamMessages,
  getStreamConversationSuccess,
  getStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { getResponseError } from '@lib/index';
import TipPerformerForm from '@components/performer/tip-form';
import dynamic from 'next/dynamic';
import Error from 'next/error';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import moment from 'moment';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), {
  ssr: false
});
const PrivateLiveStreaming = dynamic(() => import('@components/streaming/agora/private-live-streaming'), { ssr: false });
const ForwardedPublisher = forwardRef((props: {
  localUID: string,
  remoteUID: string,
  conversationId: string;
  sessionId: string;
  eventName: string;
}, ref) => <PrivateLiveStreaming {...props} forwardedRef={ref} />);

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
  settings: StreamSettings;
  activeStream: IStream;
  conversation: IConversation;
}

class LivePage extends PureComponent<IProps> {
  static layout = 'stream';

  static authenticate = true;

  private subscriberRef = createRef<{ publish: any, leave: any }>();

  private client: IAgoraRTCClient;

  private socket;

  private timerInterval;

  private remoteUID: string;

  static async getInitialProps({ ctx }) {
    const { key } = ctx.query;
    try {
      if (!key) return {};

      const resp = await streamRequestService.join(key, {
        Authorization: ctx.token || ''
      });

      return { ...resp.data };
    } catch {
      return {};
    }
  }

  state = {
    submiting: false,
    openTipModal: false,
    initialized: false,
    tokenSpent: 0
  };

  componentDidMount() {
    Router.events.on('routeChangeStart', this.onbeforeunload.bind(this));
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    Router.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  onbeforeunload = () => {
    this.leave();
  };

  async purchaseStream() {
    const { tokenSpent } = this.state;
    const { user, updateBalance: handleUpdateBalance, activeStream } = this.props;
    if (user.balance < activeStream.price) {
      message.error(
        'You have an insufficient token balance. Please top up.',
        15
      );
      Router.push('/token-package');
      return;
    }
    try {
      this.setState({ submiting: true });
      await tokenTransactionService.purchaseStream(activeStream._id);
      this.setState({ tokenSpent: tokenSpent + activeStream.price });
      handleUpdateBalance({ token: -activeStream.price });
      setTimeout(() => {
        this.purchaseStream();
      }, 60000);
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  async retryJoin(n: number) {
    if (n === 0) return;

    if (!this.subscriberRef.current) {
      setTimeout(() => this.retryJoin(n - 1), 3000);
      return;
    }

    this.client = await this.subscriberRef.current.publish();

    this.setState({ initialized: true });

    this.client.on('user-published', (user) => {
      const { activeStream } = this.props;
      if (user.uid === activeStream.performerId) {
        if (this.remoteUID === user.uid) return;

        console.log('user-published', user, user.uid);
        this.remoteUID = user.uid;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        const t = document.querySelector('.duration');
        let s = 0;
        this.timerInterval = setInterval(() => {
          s += 1000;
          t.innerHTML = moment.utc(s).format('HH:mm:ss');
        }, 1000);

        this.purchaseStream();
      }
    });
    this.client.on('user-unpublished', () => {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    });
  }

  async subscribeStream() {
    const { initialized } = this.state;

    try {
      !initialized && this.retryJoin(3);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  async start() {
    const {
      conversation,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess,
      getStreamConversation: dispatchGetStreamConversation
    } = this.props;

    const socket = this.context;

    try {
      if (conversation && conversation._id) {
        dispatchGetStreamConversationSuccess({ data: conversation });
        dispatchGetStreamConversation({
          conversation
        });
        socket
          && socket.emit('private-stream/join', {
            conversationId: conversation._id
          });
        socket && socket.on('join-broadcaster', this.subscribeStream.bind(this));
      } else {
        message.info('No available stream. Try again later');
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  leave() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage
    } = this.props;
    dispatchResetStreamMessage();
    if (this.socket && activeConversation?.data?._id) {
      this.socket.emit('private-stream/leave', {
        conversationId: activeConversation?.data?._id
      });
    }
    this.socket && this.socket.off('join-broadcaster');
  }

  modelLeftHandler({ conversationId, performerId }) {
    const { performer, activeConversation } = this.props;
    if (
      activeConversation?.data?._id !== conversationId
      || performer?._id !== performerId
    ) {
      return;
    }

    message.info('Streaming session ended! Redirecting after 10s', 10);
    // setTimeout(() => {
    //   Router.push(
    //     {
    //       pathname: '/model/profile',
    //       query: { username: performer?.username || performer?._id }
    //     },
    //     `/${performer?.username || performer?._id}`
    //   );
    // }, 10 * 1000);
  }

  async sendTip(token) {
    const {
      performer,
      user,
      updateBalance: handleUpdateBalance,
      activeConversation
    } = this.props;
    const { activeStream } = this.props;
    if (user.balance < token) {
      message.error('You have an insufficient token balance. Please top up.');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await tokenTransactionService.sendTip(performer?._id, {
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
      conversation, activeStream, performer
    } = this.props;
    const {
      submiting,
      openTipModal,
      initialized,
      tokenSpent
    } = this.state;
    if (!activeStream) return <Error statusCode={400} title="STREAM STARTING SOON" />;

    return (
      <Layout>
        <Head>
          <title>Broadcast</title>
        </Head>
        <Event
          event={STREAM_EVENT.MODEL_LEFT}
          handler={this.modelLeftHandler.bind(this)}
        />
        <AgoraProvider
          config={{ codec: 'h264', mode: 'rtc', role: 'host' }}
        >
          <div>
            <Row className="main-container">
              <Col md={16} xs={24}>
                <div className="stream-video">
                  <ForwardedPublisher
                    localUID={activeStream?.userId}
                    remoteUID={activeStream?.performerId}
                    ref={this.subscriberRef}
                    sessionId={activeStream?.sessionId}
                    conversationId={conversation?._id}
                    eventName="private-stream/play"
                  />
                  <div className="duration" />
                </div>
                <Row>
                  <Col lg={16} xs={24}>
                    <List>
                      <List.Item>
                        Spent token:
                        {' '}
                        {tokenSpent}
                      </List.Item>
                      <List.Item>
                        Price:
                        {' '}
                        {activeStream.price}
                      </List.Item>
                    </List>
                  </Col>
                  <Col lg={8} xs={24}>
                    <div>
                      {!initialized ? (
                        <Button
                          key="start-btn"
                          className="primary"
                          disabled={submiting}
                          onClick={this.start.bind(this)}
                          block
                        >
                          Start Broadcasting
                        </Button>
                      ) : (
                        <Button
                          key="start-btn"
                          className="primary"
                          disabled={submiting}
                          onClick={() => {
                            window.location.href = '/home';
                          }}
                          block
                        >
                          Stop Broadcasting
                        </Button>
                      )}
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
