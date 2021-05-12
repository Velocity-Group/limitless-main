/* eslint-disable dot-notation */
import { PureComponent, createRef } from 'react';
import Head from 'next/head';
import {
  Layout, Row, Col, message, Button, Alert, Modal, Rate
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { IResponse } from 'src/services/api-request';
import {
  IPerformer,
  IUser,
  StreamSettings,
  HLS,
  WEBRTC,
  IUIConfig
} from 'src/interfaces';
import { connect } from 'react-redux';
import {
  streamService, performerService, messageService, purchaseTokenService
} from 'src/services';
import { SocketContext, Event } from 'src/socket';
import nextCookie from 'next-cookies';
import Router from 'next/router';
import ChatBox from '@components/stream-chat/chat-box';
import LiveSubscriber from 'src/components/streaming/subscriber';
import { updateBalance } from '@redux/user/actions';
import {
  loadStreamMessages,
  getStreamConversationSuccess,
  resetStreamMessage,
  resetAllStreamMessage
} from '@redux/stream-chat/actions';
import { getResponseError, videoDuration } from '@lib/index';
import { PurchaseStreamForm } from '@components/streaming/confirm-purchase';
import { TipPerformerForm } from '@components/performer';
// import { ReviewPerformerForm } from '@components/reviews';
// import ListReviews from '@components/reviews/list-reviews';
import '../live/index.less';

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOIN_BROADCASTER = 'join-broadcaster',
  MODEL_LEFT = 'model-left',
  ROOM_INFORMATIOM_CHANGED = 'public-room-changed',
  CHANGE_STREAM_INFO = 'change-stream-info'
}

const DEFAULT_OFFLINE_IMAGE_URL = '/static/offline.jpg';
const DEFAULT_PRIVATE_IMAGE_URL = '/static/private.png';
const DEFAULT_GROUP_IMAGE_URL = '/static/group.png';
const DEFAULT_IMAGE_URL = '/static/offline.jpg';

interface IProps {
  updateBalance: Function;
  resetStreamMessage: Function;
  resetAllStreamMessage: Function;
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

  private subscrbierRef: any;

  private interval;

  private streamDurationInterval;

  private intervalCharge;

  private sessionId;

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
    poster: '',
    total: 0,
    members: [],
    conversationDescription: '',
    sessionDuration: 0,
    isFree: false,
    isBought: false,
    openPurchaseModal: false,
    submiting: false,
    openTipModal: false,
    openReviewModal: false,
    newReview: null
  };

  componentDidMount() {
    const { performer } = this.props;
    if (!performer) {
      Router.back();
      return;
    }
    this.subscrbierRef = createRef();
    Router.events.on('routeChangeStart', this.onbeforeunload.bind(this));
    window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
    this.updatePerformerInfo();
    this.interval = setInterval(this.updatePerformerInfo.bind(this), 30 * 1000);
    this.initProfilePage();
    this.subscribeStream({ performerId: performer._id });
  }

  componentDidUpdate(prevProps, prevState) {
    const { poster, isBought } = this.state;
    const {
      settings: { optionForBroadcast }
    } = this.props;
    if (!prevState.isBought && isBought && this.sessionId) {
      if (optionForBroadcast === HLS) {
        this.sessionId && this.subscrbierRef.current?.playHLS(this.sessionId);
      }
      if (optionForBroadcast === WEBRTC) {
        this.sessionId && this.subscrbierRef.current?.play(this.sessionId);
      }
      if (window['player']) {
        window['player'].dispose();
      }
      window['player'] = window['videojs']('subscriber', {
        autoplay: true,
        liveui: true
      });
      window['player'].on('ended', this.ended.bind(this));
    }
    if (poster !== prevState.poster) {
      window['player'] && window['player'].poster(poster);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload.bind(this));
    Router.events.off('routeChangeStart', this.onbeforeunload.bind(this));
  }

  handleDuration() {
    const { sessionDuration } = this.state;
    this.setState({ sessionDuration: sessionDuration + 1 });
  }

  handleStreamInfo = (data) => {
    const { isBought } = this.state;
    const { conversation, stream } = data;
    conversation && this.setState({ conversationDescription: conversation.name });
    stream && this.setState({ isFree: stream.isFree });
    if (stream && stream.isFree) {
      message.info('This stream is free to watch now!', 10);
      !isBought && this.setState({ isBought: true });
      this.intervalCharge && clearInterval(this.intervalCharge);
    }
  }

  // async handleReview({ rating, comment }) {
  //   const { performer, user } = this.props;
  //   if (!performer || !this.sessionId) return;
  //   try {
  //     const resp = await reviewService.create({
  //       objectId: this.sessionId, performerId: performer._id, rating, comment
  //     });
  //     this.setState({ newReview: { ...resp.data, creator: user } });
  //   } catch (e) {
  //     const err = await e;
  //     message.error(err?.message || 'Error occured, please try again later');
  //   } finally {
  //     this.setState({ openReviewModal: false });
  //   }
  // }

  onbeforeunload = () => {
    this.interval && clearInterval(this.interval);
    this.streamDurationInterval && clearInterval(this.streamDurationInterval);
    this.intervalCharge && clearInterval(this.intervalCharge);
    this.leavePublicRoom();
  };

  onChangeMembers({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (
      activeConversation?.data?._id
      && activeConversation.data._id === conversationId
    ) {
      this.setState({ total, members });
    }
  }

  setPoster(status: string) {
    switch (status) {
      case 'private':
        this.setState({ poster: DEFAULT_PRIVATE_IMAGE_URL });
        break;
      case 'group':
        this.setState({ poster: DEFAULT_GROUP_IMAGE_URL });
        break;
      case 'offline':
        this.setState({ poster: DEFAULT_OFFLINE_IMAGE_URL });
        break;
      case 'public':
        this.setState({ poster: DEFAULT_IMAGE_URL });
        break;
      default:
        this.setState({ poster: DEFAULT_OFFLINE_IMAGE_URL });
        break;
    }
  }

  updatePerformerInfo = async () => {
    try {
      const { performer } = this.props;
      if (!performer) {
        return;
      }
      const resp = await performerService.findOne(performer.username);
      const { streamingStatus } = resp.data;
      this.setPoster(streamingStatus);
    } catch (e) {
      const error = await Promise.resolve(e);
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  async purchaseStream() {
    const { isFree, isBought } = this.state;
    const { performer, user, updateBalance: handleUpdateBalance } = this.props;
    if (isFree || !this.sessionId) return;
    if (!isFree && user.balance < performer.publicChatPrice) {
      isBought && this.setState({ isBought: false });
      message.error('Your token balance is not enough!', 15);
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await purchaseTokenService.purchaseStream(this.sessionId);
      !isBought && this.setState({ isBought: true });
      handleUpdateBalance({ token: -performer.publicChatPrice });
    } catch (e) {
      isBought && this.setState({ isBought: false });
      const error = await e;
      message.error(error?.message || 'Error occured, please try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  async confirmJoinStream() {
    if (!this.intervalCharge) {
      this.purchaseStream();
      this.intervalCharge = setInterval(this.purchaseStream.bind(this), 60 * 1000);
    }
    this.setState({ openPurchaseModal: false });
  }

  async subscribeStream({ performerId }) {
    try {
      const resp = await streamService.joinPublicChat(performerId);
      const {
        sessionId, isFree, isStreaming, streamingTime
      } = resp.data;
      this.sessionId = sessionId;
      await this.setState({ isFree });
      if (isStreaming) {
        await this.setState({ sessionDuration: streamingTime || 0 });
        this.streamDurationInterval = setInterval(this.handleDuration.bind(this), 1000);
        if (isFree) {
          this.intervalCharge && clearInterval(this.intervalCharge);
          this.setState({ isBought: true });
        } else {
          this.setState({ openPurchaseModal: true });
        }
      }
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  initProfilePage() {
    const {
      performer: { streamingStatus }
    } = this.props;
    this.setPoster(streamingStatus);
    this.joinPeformerPublicRoom();
    window['player'] && window['player'].controls(false);
  }

  ended() {
    window['player'].controls(false);
    window['player'].reset();
    window['player'].poster(DEFAULT_OFFLINE_IMAGE_URL);
  }

  async joinPeformerPublicRoom() {
    const {
      performer,
      loadStreamMessages: dispatchLoadStreamMessages,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess
    } = this.props;
    const socket = this.context;
    try {
      const resp = await messageService.findPublicConversationPerformer(
        performer._id
      );
      const conversation = resp.data;
      if (conversation && conversation._id) {
        this.handleStreamInfo({ conversation });
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
    const { poster } = this.state;
    if (window['player']) {
      window['player'].reset();
      window['player'].poster(poster);
    }

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
    this.streamDurationInterval && clearInterval(this.streamDurationInterval);
    message.info('Streaming session has ended!');
    // setTimeout(() => {
    //   this.setState({ openReviewModal: true });
    // }, 2000);
  }

  async sendTip(token) {
    const {
      performer, user, updateBalance: handleUpdateBalance, activeConversation
    } = this.props;
    if (user.balance < token) {
      message.error('Your token balance is not enough!');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await purchaseTokenService.sendTip(performer?._id, { token, conversationId: activeConversation.data._id, streamType: 'stream_public' });
      message.success('Thank you for the tip!');
      handleUpdateBalance({ token: -token });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ submiting: false, openTipModal: false });
    }
  }

  render() {
    const {
      performer, user, ui, settings, resetAllStreamMessage: dispatchResetAllStreamMessage
    } = this.props;
    if (!this.subscrbierRef) this.subscrbierRef = createRef();
    const {
      members, total, conversationDescription, poster, openPurchaseModal,
      sessionDuration, isBought, submiting, openTipModal, openReviewModal, newReview
    } = this.state;
    return (
      <Layout>
        <Head>
          <title>{`${ui?.siteName || ''} | ${performer?.name || performer?.username} Broadcast`}</title>
        </Head>
        <Event
          event={STREAM_EVENT.JOIN_BROADCASTER}
          handler={this.subscribeStream.bind(this)}
        />
        <Event
          event={STREAM_EVENT.CHANGE_STREAM_INFO}
          handler={this.handleStreamInfo.bind(this)}
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
            <Col md={14} xs={24}>
              {conversationDescription && <Alert style={{ margin: '0 0 10px', textAlign: 'center' }} type="info" message={conversationDescription} />}
              <div className={isBought ? 'stream-show' : 'stream-hide'}>
                <LiveSubscriber
                  {...this.props}
                  ref={this.subscrbierRef}
                  configs={{
                    isPlayMode: true
                  }}
                />
              </div>
              {!isBought && (
                <img alt="img" src={poster} width="100%" />
              )}
              <div className="stream-duration">
                <div>
                  <Rate style={{ fontSize: 14 }} allowHalf defaultValue={performer?.stats?.avgRating || 0} disabled />
                  {performer?.stats?.avgRating > 0 && (
                  <small>
                    {' '}
                    {performer.stats.avgRating.toFixed(2)}
                  </small>
                  )}
                </div>
                <span>
                  <span style={{ marginRight: 5 }}>
                    <ClockCircleOutlined />
                    {' '}
                    {videoDuration(sessionDuration)}
                  </span>
                  <img src="/static/gem-ico.png" alt="gem" width="20px" />
                  {' '}
                  {(user?.balance || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ margin: 10, display: 'flex' }}>
                {/* <Button
                  block
                  className="secondary"
                  disabled={!performer?.isOnline}
                  onClick={() => Router.push(
                    {
                      pathname: `/stream/${settings?.optionForGroup === 'webrtc'
                        ? 'webrtc/'
                        : ''
                      }groupchat`,
                      query: { performer: JSON.stringify(performer) }
                    },
                    `/stream/${settings?.optionForGroup === 'webrtc'
                      ? 'webrtc/'
                      : ''
                    }groupchat/${performer?.username}`
                  )}
                >
                  Group Chat
                </Button> */}
                <Button
                  block
                  className="secondary"
                  disabled={!performer?.isOnline}
                  onClick={() => Router.push(
                    {
                      pathname: `/stream/${settings?.optionForPrivate === 'webrtc'
                        ? 'webrtc/'
                        : ''
                      }privatechat`,
                      query: { performer: JSON.stringify(performer) }
                    },
                    `/stream/${settings?.optionForPrivate === 'webrtc'
                      ? 'webrtc/'
                      : ''
                    }privatechat/${performer?.username}`
                  )}
                >
                  Private Call
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
            <Col md={10} xs={24}>
              <ChatBox
                {...this.props}
                members={members}
                totalParticipant={total}
                resetAllStreamMessage={dispatchResetAllStreamMessage}
                hideMember={false}
              />
            </Col>
          </Row>
          {/* {this.sessionId && (
          <div>
            <h4 className="page-heading">
              <CommentOutlined />
              {' '}
              REVIEWS
            </h4>
            <ListReviews newReview={newReview} objectId={this.sessionId} objectType="stream" />
          </div>
          )} */}
          {/* <Modal
            key="reviews"
            title={null}
            visible={openReviewModal}
            onOk={() => this.setState({ openReviewModal: false })}
            footer={null}
            onCancel={() => this.setState({ openReviewModal: false })}
            destroyOnClose
          >
            <ReviewPerformerForm type="public_chat" performer={performer} submiting={submiting} onFinish={this.handleReview.bind(this)} />
          </Modal> */}
          <Modal
            key="tip"
            title={null}
            visible={openTipModal}
            onOk={() => this.setState({ openTipModal: false })}
            footer={null}
            onCancel={() => this.setState({ openTipModal: false })}
            destroyOnClose
          >
            <TipPerformerForm performer={performer} submiting={submiting} onFinish={this.sendTip.bind(this)} />
          </Modal>
          <Modal
            key="confirm_join_stream"
            title={`Join ${performer?.name || performer?.username || 'N/A'} live chat`}
            visible={openPurchaseModal}
            footer={null}
            destroyOnClose
            onCancel={() => Router.back()}
          >
            <PurchaseStreamForm streamType="public" submiting={submiting} performer={performer} onFinish={this.confirmJoinStream.bind(this)} />
          </Modal>
        </div>
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
  resetAllStreamMessage
};
export default connect(mapStateToProps, mapDispatch)(LivePage);
