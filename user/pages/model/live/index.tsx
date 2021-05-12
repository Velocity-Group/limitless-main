/* eslint-disable dot-notation */
import React, { PureComponent } from 'react';
import Head from 'next/head';
import {
  Row, Col, Button, message, Modal, Alert, Layout
} from 'antd';
import {
  EditOutlined, ClockCircleOutlined, VideoCameraOutlined, PlayCircleOutlined
  // CommentOutlined
} from '@ant-design/icons';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IUser, StreamSettings
} from 'src/interfaces';
import { messageService, streamService } from 'src/services';
import LivePublisher from '@components/streaming/publisher';
import StreamPriceForm from '@components/streaming/set-price-session';
import { SocketContext, Event } from 'src/socket';
import {
  getStreamConversation,
  resetStreamMessage,
  resetAllStreamMessage
} from '@redux/stream-chat/actions';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import ChatBox from '@components/stream-chat/chat-box';
import Router, { Router as RouterEvent } from 'next/router';
import { getResponseError, videoDuration } from '@lib/index';
import './index.less';

// eslint-disable-next-line no-shadow
enum EVENT_NAME {
  ROOM_INFORMATIOM_CHANGED = 'public-room-changed',
  ADMIN_END_SESSION_STREAM = 'admin-end-session-stream',
  LEAVE_STREAM = 'public-stream/leave'
}

interface IProps {
  ui: IUIConfig;
  settings: StreamSettings;
  resetStreamMessage: Function;
  resetAllStreamMessage: Function;
  getStreamConversation: Function;
  activeConversation: any;
  user: IPerformer;
}

interface IStates {
  loading: boolean;
  initialized: boolean;
  total?: number;
  members?: IUser[];
  submiting: boolean;
  openPriceModal: boolean;
  conversationDescription: string;
  callTime: number;
  isFree: boolean;
}

class PerformerLivePage extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  private publisherRef: any;

  private streamId: string;

  private interval: any;

  private setTimeInterval: any;

  state = {
    loading: false,
    initialized: false,
    total: 0,
    members: [],
    openPriceModal: false,
    submiting: false,
    conversationDescription: '',
    callTime: 0,
    isFree: false
  };

  componentDidMount() {
    const { user } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning('Your account is not verified ID documents yet! You could not post any content right now.');
      Router.back();
      return;
    }
    this.joinPublicRoom();
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  handler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id && activeConversation.data._id === conversationId) {
      this.setState({ total, members });
    }
  }

  onbeforeunload = () => {
    this.interval && clearInterval(this.interval);
    this.setTimeInterval && clearInterval(this.setTimeInterval);
    this.leavePublicRoom();
  }

  adminEndStream({ streamId, conversationId }) {
    const { activeConversation } = this.props;
    if (streamId !== this.streamId || conversationId !== activeConversation?.data?._id) return;
    message.warning('Administrator has ended your current stream session. If you have any questions, please contact us.', 15);
    setTimeout(() => { Router.back(); }, 5000);
  }

  async start() {
    await this.setState({ loading: true });
    try {
      const resp = await streamService.goLive();
      const id = resp.data.sessionId;
      this.streamId = id;
      this.publisherRef && this.publisherRef.start(id);
    } catch (e) {
      const err = await e;
      message.error(err?.message?.message || 'Stream server error!');
    } finally {
      this.setState({ loading: false });
    }
  }

  callback(info: WEBRTC_ADAPTOR_INFORMATIONS) {
    const { activeConversation } = this.props;
    if (activeConversation && activeConversation.data && this.streamId) {
      const socket = this.context;
      if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
        this.setState({ initialized: true });
        this.publisherRef && this.publisherRef.publish(this.streamId);
      } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_STARTED) {
        const conversation = { ...activeConversation.data };
        socket.emit('public-stream/live', { conversationId: conversation._id });
        this.interval = setInterval(() => {
          const { callTime } = this.state;
          this.setState({ callTime: callTime + 1 });
        }, 1000);
        this.setTimeInterval = setInterval(this.updateStreamDuration.bind(this), 15 * 1000);
        this.setState({ loading: false });
      } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_FINISHED) {
        this.interval && clearInterval(this.interval);
        this.setTimeInterval && clearInterval(this.setTimeInterval);
        this.setState({ loading: false });
      } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.CLOSED) {
        this.interval && clearInterval(this.interval);
        this.setTimeInterval && clearInterval(this.setTimeInterval);
        this.setState({ loading: false, initialized: false });
      }
    }
  }

  async joinPublicRoom() {
    const { getStreamConversation: dispatchGetStreamConversation } = this.props;
    const socket = this.context;
    try {
      await this.setState({ loading: true });
      const resp = await (await streamService.goLive()).data;
      if (resp) {
        const { conversation, sessionId, isFree } = resp;
        this.streamId = sessionId;
        this.setState({
          openPriceModal: true,
          conversationDescription: conversation.name,
          isFree
        });
        if (conversation && conversation._id) {
          dispatchGetStreamConversation({
            conversation
          });
          socket && socket.emit('public-stream/join', {
            conversationId: conversation._id
          });
        }
      }
    } catch (e) {
      const error = await e;
      message.error(error?.message?.message || 'Stream server error');
      // Router.back();
    } finally {
      this.setState({ loading: false });
    }
  }

  leavePublicRoom() {
    const { activeConversation, resetStreamMessage: reset } = this.props;
    const socket = this.context;
    const conversation = { ...activeConversation.data };
    if (socket && conversation && conversation._id) {
      socket.emit(EVENT_NAME.LEAVE_STREAM, { conversationId: conversation._id });
      reset();
    }
  }

  async updateStreamInfo(payload) {
    const { activeConversation } = this.props;
    const { conversationDescription, isFree } = this.state;
    try {
      await this.setState({ submiting: true });
      if (payload.name && payload.name !== conversationDescription) {
        const resp = await messageService.updateConversationName(activeConversation.data._id, { name: payload.name });
        resp && this.setState({ conversationDescription: resp.data.name });
      }
      if (payload.isFree !== isFree) {
        const resp = await streamService.updateStreamInfo({ streamId: this.streamId, isFree: payload.isFree });
        resp && this.setState({ isFree: resp.data.isFree });
      }
    } catch (e) {
      message.error(getResponseError(e) || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openPriceModal: false });
    }
  }

  async updateStreamDuration() {
    if (!this.streamId) {
      this.setTimeInterval && clearInterval(this.setTimeInterval);
      return;
    }
    const { callTime } = this.state;
    try {
      await streamService.updateStreamDuration({ streamId: this.streamId, duration: callTime });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(await e);
    }
  }

  render() {
    const { user, ui, settings } = this.props;
    const {
      loading, initialized, members, total, openPriceModal, submiting, isFree,
      conversationDescription, callTime
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>
            {`${ui?.siteName} | Public Chat`}
          </title>
        </Head>
        <Event
          event={EVENT_NAME.ROOM_INFORMATIOM_CHANGED}
          handler={this.handler.bind(this)}
        />
        <Event
          event={EVENT_NAME.ADMIN_END_SESSION_STREAM}
          handler={this.adminEndStream.bind(this)}
        />
        <Row>
          <Col xs={24} sm={24} md={14}>
            <Alert className="text-center" type="info" message={conversationDescription || `${user.name} Broadcast`} />
            <LivePublisher
              {...this.props}
              // eslint-disable-next-line no-return-assign
              ref={(ref) => this.publisherRef = ref}
              callback={this.callback.bind(this)}
              configs={{
                debug: true,
                bandwidth: 900,
                localVideoId: 'publisher'
              }}
            />
            {!initialized && <img alt="img" src="/static/offline.jpg" width="100%" style={{ margin: '5px 0' }} />}
            <p className="stream-duration">
              <span>
                <ClockCircleOutlined />
                {' '}
                {videoDuration(callTime)}
              </span>
              <span>
                <img src="/static/gem-ico.png" alt="gem" width="20px" />
                {' '}
                {(user?.balance).toFixed(2)}
              </span>
            </p>
            <div className="stream-description">
              {!initialized && (
              <Button
                key="start-btn"
                className="primary"
                onClick={this.start.bind(this)}
                loading={loading}
                disabled={loading}
                block
              >
                <PlayCircleOutlined />
                {' '}
                Start Broadcasting
              </Button>
              )}
              <Button
                key="price-btn"
                block
                className="secondary"
                disabled={loading}
                onClick={() => this.setState({ openPriceModal: true })}
              >
                {isFree ? 'Free to view' : (
                  <>
                    <img alt="token" src="/static/gem-ico.png" width="20px" />
                    {user.publicChatPrice}
                    {' '}
                    per minute
                  </>
                )}
                {' '}
                <EditOutlined />
              </Button>
              <Button
                key="group-btn"
                block
                className="secondary"
                onClick={() => Router.push(
                  {
                    pathname: `/live/${settings.optionForPrivate === 'webrtc'
                      ? 'webrtc/'
                      : ''
                    }groupchat`,
                    query: { performer: JSON.stringify(user) }
                  },
                  `/live/${settings.optionForPrivate === 'webrtc'
                    ? 'webrtc/'
                    : ''
                  }groupchat/${user?.username}`
                )}
              >
                <VideoCameraOutlined />
                {' '}
                Group Chat
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <ChatBox
              {...this.props}
              members={members}
              totalParticipant={total}
              hideMember={false}
            />
          </Col>
          <Modal
            key="update_stream"
            title="Update stream information"
            visible={openPriceModal}
            footer={null}
            onCancel={() => this.setState({ openPriceModal: false })}
          >
            <StreamPriceForm
              isFree={isFree}
              conversationDescription={conversationDescription}
              streamType="public"
              submiting={loading || submiting}
              performer={user}
              onFinish={this.updateStreamInfo.bind(this)}
            />
          </Modal>
          {/* {this.streamId && (
          <Col span={24}>
            <h4 className="page-heading">
              <CommentOutlined />
              {' '}
              REVIEWS
            </h4>
            <ListStreamReviews newReview={null} objectId={this.streamId} objectType="stream" />
          </Col>
          )} */}
        </Row>
      </Layout>
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
