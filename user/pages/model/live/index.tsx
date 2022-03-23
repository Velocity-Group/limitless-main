/* eslint-disable dot-notation */
import React, { PureComponent, createRef, forwardRef } from 'react';
import Head from 'next/head';
import {
  Row, Col, Button, message, Modal, Layout
} from 'antd';
import {
  ClockCircleOutlined, PlayCircleOutlined, EditOutlined
} from '@ant-design/icons';
import PageHeading from '@components/common/page-heading';
import { connect } from 'react-redux';
import {
  IPerformer, IUIConfig, IUser, StreamSettings, IStream
} from 'src/interfaces';
import { streamService } from 'src/services';
import StreamPriceForm from '@components/streaming/set-price-session';
import { SocketContext, Event } from 'src/socket';
import {
  getStreamConversation, resetStreamMessage, resetAllStreamMessage
} from '@redux/stream-chat/actions';
import ChatBox from '@components/stream-chat/chat-box';
import Router, { Router as RouterEvent } from 'next/router';
import { videoDuration } from '@lib/index';
import dynamic from 'next/dynamic';
import './index.less';

const AgoraProvider = dynamic(() => import('src/agora/AgoraProvider'), { ssr: false });
const Publisher = dynamic(() => import('@components/streaming/agora/publisher'), { ssr: false });
const ForwardedPublisher = forwardRef((props: {
  uid: string,
  onStatusChange: Function,
  conversationId: string;
}, ref) => <Publisher {...props} forwardedRef={ref} />);

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
  total: number;
  members: IUser[];
  openPriceModal: boolean;
  callTime: number;
  activeStream: IStream;
  editting: boolean;
}

class PerformerLivePage extends PureComponent<IProps, IStates> {
  static layout = 'stream';

  static authenticate = true;

  private publisherRef = createRef<{publish: any, leave: any}>();

  private streamDurationTimeOut: any;

  private setDurationStreamTimeOut: any;

  private descriptionRef = createRef<any>();

  state = {
    loading: false,
    initialized: false,
    total: 0,
    members: [],
    openPriceModal: false,
    callTime: 0,
    activeStream: null,
    editting: false
  };

  componentDidMount() {
    const { user } = this.props;
    if (!user || !user.verifiedDocument) {
      message.warning('Your account is not verified ID documents yet! You could not post any content right now.');
      Router.back();
      return;
    }
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.on('routeChangeStart', this.onbeforeunload.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    RouterEvent.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  // eslint-disable-next-line react/sort-comp
  handleDuration() {
    const { callTime } = this.state;
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.setState({ callTime: callTime + 1 });
    this.streamDurationTimeOut = setTimeout(this.handleDuration.bind(this), 1000);
  }

  onRoomChange = ({ total, members, conversationId }) => {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id && activeConversation.data._id === conversationId) {
      this.setState({ total, members });
    }
  }

  onStreamStatusChange = (started: boolean) => {
    if (started) {
      this.setState({ initialized: true, loading: false });
      this.handleDuration();
      this.updateStreamDuration();
    } else {
      this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
      this.setDurationStreamTimeOut && clearTimeout(this.setDurationStreamTimeOut);
    }
  }

  onbeforeunload = () => {
    this.streamDurationTimeOut && clearTimeout(this.streamDurationTimeOut);
    this.setDurationStreamTimeOut && clearTimeout(this.setDurationStreamTimeOut);
    this.leavePublicRoom();
  }

  async joinPublicRoom(payload: any) {
    const { getStreamConversation: dispatchGetStreamConversation } = this.props;
    const socket = this.context;
    try {
      await this.setState({ loading: true });
      const resp = await (await streamService.goLive(payload)).data;
      this.setState({
        activeStream: resp,
        openPriceModal: false
      });
      dispatchGetStreamConversation({
        conversation: resp.conversation
      });
      socket && socket.emit('public-stream/join', {
        conversationId: resp.conversation._id
      });
      this.publisherRef.current && this.publisherRef.current.publish();
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Stream server error, please try again later');
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

  async updateStreamDuration() {
    this.setDurationStreamTimeOut && clearTimeout(this.setDurationStreamTimeOut);
    const { callTime, activeStream } = this.state;
    if (!activeStream) return;
    await streamService.updateStreamDuration({ streamId: activeStream._id, duration: callTime });
    this.setDurationStreamTimeOut = setTimeout(this.updateStreamDuration.bind(this), 15 * 1000);
  }

  async editLive() {
    try {
      const { activeStream } = this.state;
      if (!activeStream) return;
      const description = this.descriptionRef.current.value;
      await streamService.editLive(activeStream._id, { description });
      this.setState({ activeStream: { ...activeStream, description } });
    } catch (e) {
      const error = await e;
      message.error(error?.message || 'Stream server error, please try again later');
    } finally {
      this.setState({ editting: false });
    }
  }

  render() {
    const { user, ui } = this.props;
    const {
      loading, initialized, members, total, openPriceModal, callTime, activeStream, editting
    } = this.state;
    return (
      <AgoraProvider config={{ mode: 'live', codec: 'h264', role: 'host' }}>
        <Layout>
          <Head>
            <title>
              {`${ui?.siteName} | Public Chat`}
            </title>
          </Head>
          <Event
            event={EVENT_NAME.ROOM_INFORMATIOM_CHANGED}
            handler={this.onRoomChange.bind(this)}
          />
          <Row>
            <Col xs={24} sm={24} md={16}>
              <PageHeading title={activeStream?.title || `${user.name || user?.username} Broadcast`} />
              <ForwardedPublisher
                uid={user._id}
                onStatusChange={(val) => this.onStreamStatusChange(val)}
                ref={this.publisherRef}
                conversationId={activeStream?.conversation?._id}
              />
              <p className="stream-duration">
                <span>
                  <ClockCircleOutlined />
                  {' '}
                  {videoDuration(callTime)}
                </span>
                <span>
                  <img src="/static/coin-ico.png" alt="gem" width="20px" />
                  {' '}
                  {(user?.balance).toFixed(2)}
                </span>
              </p>
              <div className="stream-description">
                {!initialized ? (
                  <Button
                    key="start-btn"
                    className="primary"
                    onClick={() => this.setState({ openPriceModal: true })}
                    disabled={loading}
                    block
                  >
                    <PlayCircleOutlined />
                    {' '}
                    Start Broadcasting
                  </Button>
                ) : (
                  <Button
                    key="start-btn"
                    className="primary"
                    onClick={() => Router.push({ pathname: '/model/profile', query: { username: user?.username || user?._id } }, `/${user?.username || user?._id}`)}
                    disabled={loading}
                    block
                  >
                    <PlayCircleOutlined />
                    {' '}
                    Stop Broadcasting
                  </Button>
                )}
              </div>
              {activeStream?.description && (
              <p>
                {editting ? (
                  <Row>
                    <Col xs={24}>
                      <textarea className="ant-input" ref={this.descriptionRef} defaultValue={activeStream.description} />
                    </Col>
                    <Col xs={24}>
                      <Button className="primary" icon={<EditOutlined />} onClick={() => this.editLive()}>Update</Button>
                    </Col>
                  </Row>
                ) : (
                  <>
                    {activeStream.description}
                    {' '}
                    <EditOutlined onClick={() => this.setState({ editting: true })} />
                  </>
                )}
              </p>
              )}
            </Col>
            <Col xs={24} sm={24} md={8}>
              <ChatBox
                {...this.props}
                members={members}
                totalParticipant={total}
              />
            </Col>
            <Modal
              centered
              key="update_stream"
              title="Update stream information"
              visible={openPriceModal}
              footer={null}
              onCancel={() => this.setState({ openPriceModal: false })}
            >
              <StreamPriceForm
                submiting={loading}
                performer={user}
                onFinish={this.joinPublicRoom.bind(this)}
              />
            </Modal>
          </Row>
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
