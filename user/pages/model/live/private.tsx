/* eslint-disable dot-notation */
import React, { PureComponent, createRef, forwardRef } from 'react';
import Head from 'next/head';
import {
  Row, Col, Button, message, Layout, Input
} from 'antd';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IUser, StreamSettings, IStream, IConversation
} from 'src/interfaces';
import { streamRequestService } from 'src/services';
import { SocketContext } from 'src/socket';
import {
  getStreamConversation, resetStreamMessage, resetAllStreamMessage
} from '@redux/stream-chat/actions';
import ChatBox from '@components/stream-chat/chat-box';
import Router, { Router as RouterEvent } from 'next/router';
import dynamic from 'next/dynamic';
import './index.less';
import Error from 'next/error';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import moment from 'moment';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), { ssr: false });
const PrivateLiveStreaming = dynamic(() => import('@components/streaming/agora/private-live-streaming'), { ssr: false });
const ForwardedPublisher = forwardRef((props: {
  localUID: string,
  remoteUID: string,
  conversationId: string;
  sessionId: string;
  eventName: string;
}, ref) => <PrivateLiveStreaming {...props} forwardedRef={ref} />);

// eslint-disable-next-line no-shadow
enum EVENT_NAME {
  LEAVE_STREAM = 'private-stream/leave'
}

interface IProps {
  ui: IUIConfig;
  settings: StreamSettings;
  resetStreamMessage: Function;
  resetAllStreamMessage: Function;
  getStreamConversation: Function;
  activeConversation: any;
  user: IPerformer;
  activeStream: IStream;
  conversation: IConversation;
  requestId: string;
}

interface IStates {
  loading: boolean;
  initialized: boolean;
  members?: IUser[];
}

class PerformerLivePage extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  private client: IAgoraRTCClient;

  private publisherRef = createRef<{publish: any, leave: any}>();

  private inputRef = createRef<any>();

  private timerInterval;

  static async getInitialProps({ ctx }) {
    const { key } = ctx.query;
    try {
      if (!key) return {};

      const resp = await streamRequestService.start(key, {
        Authorization: ctx.token || ''
      });

      return {
        activeStream: resp.data.activeStream,
        conversation: resp.data.conversation,
        requestId: key
      };
    } catch {
      return {};
    }
  }

  state = {
    loading: false,
    initialized: false
  };

  componentDidMount() {
    const { user } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning('Your account is not verified ID documents yet! You could not post any content right now.');
      Router.back();
      return;
    }

    // this.init();
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  onbeforeunload = () => {
    this.leave();
  }

  async init() {
    const { getStreamConversation: dispatchGetStreamConversation, conversation } = this.props;
    if (!conversation) return;

    const socket = this.context;
    try {
      this.setState({ loading: true });
      dispatchGetStreamConversation({
        conversation
      });
      socket && socket.emit('private-stream/join', {
        conversationId: conversation._id
      });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Stream server error, please try again later');
    } finally {
      this.setState({ loading: false });
    }
  }

  async start() {
    if (!this.publisherRef.current) return;

    const {
      requestId, activeStream, conversation, getStreamConversation: dispatchGetStreamConversation
    } = this.props;

    if (this.inputRef.current.input) {
      await streamRequestService.edit(requestId, { price: +this.inputRef.current.input.value });
    }

    const socket = this.context;
    dispatchGetStreamConversation({
      conversation
    });
    socket && socket.emit('private-stream/join', {
      conversationId: conversation._id
    });

    this.client = await this.publisherRef.current.publish() as IAgoraRTCClient;

    this.setState({ initialized: true });

    this.client.on('user-published', (user) => {
      if (user.uid === activeStream.userId) {
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
      }
    });
    this.client.on('user-unpublished', () => {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    });
  }

  leave() {
    const { activeConversation, resetStreamMessage: reset } = this.props;
    const socket = this.context;
    const conversation = { ...activeConversation.data };
    if (socket && conversation && conversation._id) {
      socket.emit(EVENT_NAME.LEAVE_STREAM, { conversationId: conversation._id });
      reset();
    }
  }

  render() {
    const {
      ui, activeStream, conversation
    } = this.props;
    const {
      loading, initialized
    } = this.state;

    if (!activeStream) return <Error statusCode={404} />;

    return (
      <AgoraProvider config={{ mode: 'rtc', codec: 'h264', role: 'host' }}>
        <Layout>
          <Head>
            <title>
              {`${ui?.siteName} | Live`}
            </title>
          </Head>
          <div>
            <Row className="main-container">
              <Col xs={24} sm={24} md={16} style={{ padding: 10 }}>
                <ForwardedPublisher
                  localUID={activeStream?.performerId}
                  remoteUID={activeStream?.userId}
                  ref={this.publisherRef}
                  conversationId={conversation?._id}
                  sessionId={activeStream?.sessionId}
                  eventName="private-stream/live"
                />
                <div>
                  <div className="duration" />
                  <Input disabled={initialized} style={{ margin: '5px 0' }} defaultValue={10} ref={this.inputRef} />
                  {!initialized ? (
                    <Button
                      key="start-btn"
                      className="primary"
                      disabled={loading}
                      onClick={this.start.bind(this)}
                      block
                    >
                      Start Broadcasting
                    </Button>
                  ) : (
                    <Button
                      key="start-btn"
                      className="primary"
                      disabled={loading}
                      onClick={() => {
                        window.location.href = '/home';
                      }}
                      block
                    >
                      Stop Broadcasting
                    </Button>
                  )}
                </div>
              </Col>
              <Col xs={24} sm={24} md={8} style={{ padding: 10 }}>
                <ChatBox
                  {...this.props}
                />
              </Col>
            </Row>
          </div>
        </Layout>
      </AgoraProvider>
    );
  }
}

PerformerLivePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  ...state.streaming,
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation }
});
const mapDispatchs = {
  getStreamConversation,
  resetStreamMessage,
  resetAllStreamMessage
};
export default connect(mapStateToProps, mapDispatchs)(PerformerLivePage);
