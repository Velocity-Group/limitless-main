/* eslint-disable no-console */
import { PureComponent, createRef } from 'react';
import Header from 'next/head';
import {
  Row, Col, message, Button
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import Router, { Router as RouterEvent } from 'next/router';
import {
  IPerformer, IUIConfig, IUser, StreamSettings
} from 'src/interfaces';
import { streamService } from 'src/services';
import { connect } from 'react-redux';
import { SocketContext, Event } from 'src/socket';
import ChatBox from '@components/stream-chat/chat-box';
import {
  getStreamConversationSuccess,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import GroupChatPublisher from 'src/components/streaming/webrtc/groupchat/publisher';
import GroupHlsSubscriber from 'src/components/streaming/hls/group/subscriber';
import { getResponseError, videoDuration } from '@lib/index';
import './index.less';

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  ADMIN_END_SESSION_STREAM = 'admin-end-session-stream'
}

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEAVED = 'private-stream/streamLeaved';
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';

interface IProps {
  user: IPerformer;
  isStreaming: boolean;
  setStreaming: Function;
  getStreamConversationSuccess: Function;
  activeConversation: any;
  resetStreamMessage: Function;
  tipSound: string;
  settings: StreamSettings;
  ui: IUIConfig
}

interface IStates {
  processing: boolean;
  roomJoined: boolean;
  total?: number;
  members?: IUser[];
  // streamId: string;
  streamList: string[];
  callTime: number;
}

class ModelGroupChat extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  static onlyPerformer = true;

  private readonly localVideoId = 'group-publisher';

  private _intervalCallTime;

  private setTimeInterval;

  private publisherRef;

  private subscriberRef;

  private socket;

  private streamId;

  constructor(props: IProps) {
    super(props);
    this.state = {
      processing: false,
      roomJoined: false,
      total: 0,
      members: [],
      // streamId: '',
      streamList: [],
      callTime: 0
    };
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onbeforeunload);
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload);
    this.socket = this.context;
    this.publisherRef = createRef();
    this.subscriberRef = createRef();
  }

  componentDidUpdate(prevProps: IProps) {
    const { activeConversation } = this.props;
    if (prevProps.activeConversation && prevProps.activeConversation?.data?._id !== activeConversation?.data?._id) {
      this.initSocketEvent();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload);
  }

  handler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id && conversationId === activeConversation.data._id) {
      this.setState({
        total,
        members
      });
    }
  }

  onbeforeunload = () => {
    this.leaveSession();
  }

  adminEndStream({ streamId, conversationId }) {
    const { activeConversation } = this.props;
    if (streamId !== this.streamId || conversationId !== activeConversation.data._id) return;
    message.warning('Administrator has ended your current stream session. If you have any questions, please contact us.');
    setTimeout(() => { Router.back(); }, 5000);
  }

  initSocketEvent() {
    this.socket = this.context;
    this.socket.on(
      JOINED_THE_ROOM,
      ({ streamId, conversationId }) => {
        const { activeConversation } = this.props;
        if (conversationId !== activeConversation.data._id) return;
        this.setState({ roomJoined: true });
        this.streamId = streamId;
        this.publisherRef.current && this.publisherRef.current.publish(streamId);
      }
    );
    this.socket.on(STREAM_JOINED, (data: { streamId: string }) => {
      const { streamList } = this.state;
      if (this.streamId !== data.streamId) {
        this.setState({ streamList: [...streamList, data.streamId] });
      }
    });
    this.socket.on(STREAM_LEAVED, (data: { streamId: string }) => {
      if (this.streamId !== data.streamId) {
        const { streamList } = this.state;
        this.setState({ streamList: streamList.filter((id) => id !== data.streamId) });
      }
    });
  }

  leaveSession() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage
    } = this.props;
    dispatchResetStreamMessage();
    if (this.socket && activeConversation?.data?._id) {
      this.socket.off(JOINED_THE_ROOM);
      this.socket.off(STREAM_JOINED);
      this.socket.off(STREAM_LEAVED);
      this.socket.emit(STREAM_EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
      });
    }
    this._intervalCallTime && clearInterval(this._intervalCallTime);
    this.setTimeInterval && clearInterval(this.setTimeInterval);
    this.setState({
      processing: false,
      roomJoined: false,
      total: 0,
      members: []
    });
  }

  async startConversation() {
    const { getStreamConversationSuccess: dispatchGetStreamConversationSuccess } = this.props;
    try {
      this.setState({ processing: true });
      const resp = await streamService.startGroupChat();
      if (resp && resp.data) {
        const { conversation } = resp.data;
        this.socket = this.context;
        this.publisherRef.current && this.publisherRef.current.start(conversation._id);
        dispatchGetStreamConversationSuccess({
          data: conversation
        });
        this.socket && this.socket.emit(STREAM_EVENT.JOIN_ROOM, {
          conversationId: resp.data.conversation._id
        });
        this._intervalCallTime = setInterval(() => {
          const { callTime } = this.state;
          this.setState({ callTime: callTime + 1 });
        }, 1000);
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ processing: false });
    }
  }

  leave() {
    this.publisherRef.current && this.publisherRef.current.stop();
    this.subscriberRef.current && this.subscriberRef.current.stop();
    Router.back();
  }

  render() {
    const { ui, user } = this.props;
    const {
      processing, total, members, roomJoined, callTime, streamList
    } = this.state;
    if (!this.subscriberRef) this.subscriberRef = createRef();
    if (!this.publisherRef) this.publisherRef = createRef();
    return (
      <>
        <Header>
          <title>{`${ui?.siteName} | Group Chat`}</title>
        </Header>

        <Event
          event={STREAM_EVENT.STREAM_INFORMATION_CHANGED}
          handler={this.handler.bind(this)}
        />
        <Event
          event={STREAM_EVENT.ADMIN_END_SESSION_STREAM}
          handler={this.adminEndStream.bind(this)}
        />
        <div className="container">
          <Row>
            <Col md={14} xs={24}>
              <Row className={!roomJoined ? 'groupchat-video-container hide' : 'groupchat-video-container'}>
                <GroupChatPublisher
                  classNames="ant-col ant-col-md-6 ant-col-xs-12"
                  {...this.props}
                  id={this.localVideoId}
                  containerClassName="groupchat-video-container"
                  ref={this.publisherRef}
                  configs={{
                    localVideoId: this.localVideoId
                  }}
                />
                {streamList.length > 0 && streamList.map((streamId) => (
                  <GroupHlsSubscriber
                    classNames="ant-col ant-col-md-6 ant-col-xs-12"
                    key={streamId}
                    {...this.props}
                    streamId={streamId}
                    containerClassName="groupchat-video-container"
                    configs={{
                      isPlayMode: true
                    }}
                  />
                ))}
              </Row>
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
              {!roomJoined
                ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      key="start_broadcast"
                      className="primary"
                      onClick={this.startConversation.bind(this)}
                      loading={processing}
                      block
                    >
                      Start Group Chat
                    </Button>
                    <Button
                      key="leave_broadcast"
                      className="secondary"
                      onClick={() => Router.back()}
                      loading={processing}
                      block
                    >
                      Back
                    </Button>
                  </div>
                )
                : (
                  <Button
                    className="error"
                    onClick={this.leave.bind(this)}
                    block
                    disabled={processing}
                  >
                    End Call
                  </Button>
                )}
            </Col>
            <Col xs={24} md={10}>
              <ChatBox
                {...this.props}
                totalParticipant={total}
                members={members}
              />
            </Col>
          </Row>
        </div>
      </>
    );
  }
}

ModelGroupChat.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ui: { ...state.ui },
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation },
  ...state.streaming
});

const mapDispatchs = {
  getStreamConversationSuccess,
  resetStreamMessage
};

export default connect(
  mapStateToProps,
  mapDispatchs
)(ModelGroupChat);
