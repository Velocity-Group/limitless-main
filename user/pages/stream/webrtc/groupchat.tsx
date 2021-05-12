import React, { PureComponent } from 'react';
import Header from 'next/head';
import {
  Row, Col, message, Button, Modal
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import Router, { Router as RouterEvent } from 'next/router';
import {
  IPerformer, IUIConfig, IUser, StreamSettings
} from 'src/interfaces';
import { performerService, streamService, purchaseTokenService } from 'src/services';
import { connect } from 'react-redux';
import {
  getStreamConversationSuccess,
  loadMoreStreamMessages,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateBalance } from '@redux/user/actions';
import { SocketContext, Event } from 'src/socket';
import nextCookie from 'next-cookies';
import ChatBox from '@components/stream-chat/chat-box';
import { getResponseError, videoDuration } from '@lib/index';
import GroupPublisher from '@components/streaming/webrtc/groupchat/publisher';
import GroupSubscriber from '@components/streaming/webrtc/groupchat/subscriber';
import { PurchaseStreamForm } from '@components/streaming/confirm-purchase';
import { TipPerformerForm } from '@components/performer/tip-form';
import '../../live/index.less';

// eslint-disable-next-line no-shadow
enum EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  MODEL_JOIN_ROOM = 'MODEL_JOIN_ROOM'
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
  loadMoreStreamMessages: Function;
  activeConversation: any;
  resetStreamMessage: Function;
  settings: StreamSettings;
  updateBalance: Function;
}

interface IStates {
  openPriceModal: boolean;
  openTipModal: boolean;
  roomJoined: boolean;
  processing: boolean;
  total: number;
  members: IUser[];
  callTime: number;
  streamId: string;
  streamList: string[];
}

class UserGroupChat extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  private readonly localVideoId = 'group-publisher';

  private mainVideoRef;

  private publisherRef;

  private subscriberRef;

  private intervalCharge;

  private _intervalCallTime;

  private socket;

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
      const performer = resp.data;
      // if (performer.isBlocked) {
      //   throw StatusCodes.FORBIDDEN;
      // }

      return {
        performer
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('No creator was found!');
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
      openPriceModal: true,
      openTipModal: false,
      processing: false,
      roomJoined: false,
      total: 0,
      callTime: 0,
      members: [],
      streamId: '',
      streamList: []
    };
  }

  componentDidMount() {
    this.publisherRef = React.createRef();
    this.subscriberRef = React.createRef();
    this.mainVideoRef = React.createRef();
    this.socket = this.context;
    window.addEventListener('beforeunload', this.onbeforeunload);
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload);
  }

  componentDidUpdate(prevProps: IProps) {
    const { activeConversation } = this.props;
    if (prevProps?.activeConversation?.data?._id !== activeConversation?.data?._id) {
      this.initSocketEvent();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload);
  }

  handler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (conversationId === activeConversation?.data?._id) {
      this.setState({
        total,
        members
      });
    }
  }

  // handleRemoteVideo(event) {
  //   const { srcObject } = event.target;
  //   this.mainVideoRef.current.srcObject = srcObject;
  //   this.mainVideoRef.current.hidden = false;
  //   this.mainVideoRef.current.play();
  // }

  onbeforeunload = () => {
    this.leaveSession();
  };

  leaveSession() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage
    } = this.props;
    dispatchResetStreamMessage();
    if (this.socket && activeConversation && activeConversation.data) {
      this.socket.off(JOINED_THE_ROOM);
      this.socket.off(STREAM_JOINED);
      this.socket.off(STREAM_LEAVED);
      this.socket.emit(EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
      });
    }

    this.intervalCharge && clearInterval(this.intervalCharge);
    this._intervalCallTime && clearInterval(this._intervalCallTime);
  }

  async joinGroupChat() {
    const {
      performer,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess,
      loadMoreStreamMessages: dispatchLoadStreamMessages
    } = this.props;
    try {
      await this.setState({ processing: true });
      const resp = await streamService.joinGroupChat(performer._id);
      if (resp && resp.data) {
        this.socket = this.context;
        const { sessionId, conversation } = resp.data;
        this.publisherRef.current
          && this.publisherRef.current.start(conversation._id, sessionId);
        dispatchGetStreamConversationSuccess({
          data: conversation
        });
        dispatchLoadStreamMessages({
          conversationId: conversation._id,
          limit: 25,
          offset: 0,
          type: conversation.type
        });
        this.socket.emit(EVENT.JOIN_ROOM, {
          conversationId: conversation._id
        });
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
      Router.back();
    } finally {
      this.setState({ processing: false, openPriceModal: false });
    }
  }

  leave() {
    this.publisherRef.current && this.publisherRef.current.stop();
    this.subscriberRef.current && this.subscriberRef.current.stop();
    Router.back();
  }

  async purchaseStream() {
    const {
      performer, user, updateBalance: handleUpdateBalance, activeConversation
    } = this.props;
    if (!activeConversation?.data?.streamId) return;
    if (user.balance < performer.groupChatPrice) {
      message.error('Your token balance is not enough!', 15);
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ processing: true });
      await purchaseTokenService.purchaseStream(activeConversation?.data?.streamId);
      handleUpdateBalance({ token: -performer.groupChatPrice });
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
      ({ streamId, streamList, conversationId }) => {
        const { activeConversation } = this.props;
        if (conversationId !== activeConversation.data._id) return;
        this.setState({ streamId, streamList, roomJoined: true });
        this.publisherRef.current && this.publisherRef.current.publish(streamId);
        if (streamList.length) {
          this.subscriberRef.current && this.subscriberRef.current.play(streamList);
        }
        this.purchaseStream();
        this.intervalCharge = setInterval(this.purchaseStream.bind(this), 60 * 1000);
        this._intervalCallTime = setInterval(() => {
          const { callTime } = this.state;
          this.setState({ callTime: callTime + 1 });
        }, 1000);
      }
    );
    this.socket.on(STREAM_JOINED, (data: { streamId: string }) => {
      const { streamId } = this.state;
      if (streamId !== data.streamId) {
        this.subscriberRef.current && this.subscriberRef.current.play([data.streamId]);
      }
    });
    this.socket.on(STREAM_LEAVED, (data: { streamId: string, user: IPerformer }) => {
      const { streamList, streamId } = this.state;
      const { performer, activeConversation } = this.props;
      if (data.user && data.user._id === performer._id) {
        message.info(`${performer?.name || performer?.username} has left this conversation, redirecting to his profile`);
        setTimeout(() => { Router.replace({ pathname: '/profile', query: { performer: JSON.stringify(performer), username: performer?.username, streamId: activeConversation?.data?.streamId } }, `/${performer?.username}${activeConversation?.data?.streamId ? `?streamId=${activeConversation?.data?.streamId}` : null}`); }, 5000);
        return;
      }
      this.setState({
        streamList: streamList.filter((id) => id !== data.streamId)
      });
      if (streamId !== data.streamId) {
        this.subscriberRef.current && this.subscriberRef.current.close(data.streamId);
      }
    });
  }

  async sendTip(token) {
    const {
      performer, user, updateBalance: handleUpdateBalance, activeConversation
    } = this.props;
    if (!activeConversation || !activeConversation.data || !activeConversation.data._id) return;
    if (user.balance < token) {
      message.error('Your token balance is not enough!');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ processing: true });
      await purchaseTokenService.sendTip(performer?._id, { token, conversationId: activeConversation.data._id, streamType: 'stream_group' });
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
    const { performer, ui, user } = this.props;
    const {
      processing, total, members, roomJoined, callTime, openPriceModal, openTipModal
    } = this.state;

    return (
      <>
        <Header>
          <title>{`${ui?.siteName} | ${performer?.name || performer?.username || 'N/A'} Group Chat`}</title>
        </Header>
        <Event
          event={EVENT.STREAM_INFORMATION_CHANGED}
          handler={this.handler.bind(this)}
        />
        {/* <Event
          event={EVENT.JOINED_THE_ROOM}
          handler={this.roomJoinedHandler.bind(this)}
        /> */}
        <div className="container">
          <Row>
            <Col md={14} xs={24}>
              {/* <div style={{ display: 'flex', justifyContent: 'center' }}>
                <video
                  id="subscriber"
                  ref={this.mainVideoRef}
                  hidden
                  controls
                />
              </div> */}
              <Row className={!roomJoined ? 'groupchat-video-container hide' : 'groupchat-video-container'}>
                <GroupPublisher
                  {...this.props}
                  id={this.localVideoId}
                  ref={this.publisherRef}
                  containerClassName="groupchat-video-container"
                  configs={{
                    localVideoId: this.localVideoId
                  }}
                />
                <GroupSubscriber
                  {...this.props}
                  ref={this.subscriberRef}
                  classNames="ant-col"
                  // onClick={this.handleRemoteVideo.bind(this)}
                  containerClassName="groupchat-video-container"
                  configs={{
                    isPlayMode: true
                  }}
                />
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
              {roomJoined && (
              <div style={{ display: 'flex' }}>
                <Button
                  className="primary"
                  onClick={this.leave.bind(this)}
                  block
                  disabled={processing}
                >
                  Leave Group Chat
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
              />
            </Col>
          </Row>
          <Modal
            key="update_stream"
            title={`Confirm to join ${performer?.name || performer?.username || 'N/A'} group chat`}
            visible={openPriceModal}
            footer={null}
            onCancel={() => Router.back()}
          >
            <PurchaseStreamForm streamType="group" submiting={processing} performer={performer} onFinish={this.joinGroupChat.bind(this)} />
          </Modal>
          <Modal
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
      </>
    );
  }
}

UserGroupChat.contextType = SocketContext;

const mapStateToProps = (state) => ({
  ...state.streaming,
  ui: { ...state.ui },
  user: { ...state.user.current },
  activeConversation: { ...state.streamMessage.activeConversation }
});
const mapDispatchs = {
  getStreamConversationSuccess,
  loadMoreStreamMessages,
  resetStreamMessage,
  updateBalance
};
export default connect(
  mapStateToProps,
  mapDispatchs
)(UserGroupChat);
