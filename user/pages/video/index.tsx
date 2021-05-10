/* eslint-disable no-prototype-builtins */
import { PureComponent } from 'react';
import {
  Layout,
  Tabs,
  Button,
  Tag,
  message,
  Space,
  Row,
  Col,
  Input,
  Modal,
  Spin
} from 'antd';
import {
  LikeOutlined,
  EyeOutlined,
  HourglassOutlined,
  HeartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { connect } from 'react-redux';
import Head from 'next/head';
import { videoService, reactionService, paymentService } from '@services/index';
import {
  RelatedListVideo,
  VideoPlayer,
  ThumbnailVideo
} from '@components/video';
import {
  getComments, moreComment, createComment, deleteComment
} from '@redux/comment/actions';
import { ListComments, CommentForm } from '@components/comment';
import Link from 'next/link';
import './video.less';
import Router from 'next/router';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import Loader from '@components/common/base/loader';
import { videoDuration } from '@lib/index';
import {
  IVideoResponse,
  IUser,
  IUIConfig,
  ICoupon,
  IPerformer
} from '../../src/interfaces';
import { getRelated } from '../../src/redux/video/actions';

const { TabPane } = Tabs;

interface IProps {
  query: any;
  user: IUser;
  relatedVideos: any;
  getRelated: Function;
  ui: IUIConfig;
  video: IVideoResponse;
  getComments: Function;
  moreComment: Function;
  createComment: Function;
  deleteComment: Function;
  commentMapping: any;
  comment: any;
}

class VideoViewPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static noredirect: boolean = false;

  subscriptionType = 'monthly';

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const video = (await (
        await videoService.findOne(query.id, {
          Authorization: ctx.token
        })
      ).data) as IVideoResponse;
      if (video) {
        return {
          video
        };
      }
    } catch (e) {
      return {
        query
      };
    }
    return {};
  }

  state = {
    videoStats: { likes: 0, comments: 0, views: 0 },
    userReaction: { liked: false, favourited: false, watchedLater: false },
    itemPerPage: 24,
    commentPage: 0,
    isFirstLoadComment: true,
    isBought: false,
    isSubscribed: false,
    couponCode: '',
    isApplyCoupon: false,
    coupon: null as ICoupon,
    openSubscriptionModal: false,
    submiting: false
  };

  async componentDidMount() {
    const { video, getRelated: getRelatedHandler } = this.props;
    if (!video || !video._id) {
      Router.back();
      return;
    }
    this.setState({
      videoStats: video.stats,
      userReaction: video.userReaction,
      isBought: video.isBought,
      isSubscribed: video.isSubscribed
    });
    this.onUpdateStats();
    getRelatedHandler({
      performerId: video.performerId,
      excludedId: video._id,
      status: 'active',
      limit: 24
    });
  }

  componentDidUpdate(prevProps) {
    const { video, getRelated: getRelatedHandler } = this.props;
    if (prevProps.video._id !== video._id) {
      this.onUpdateStats();
      getRelatedHandler({
        performerId: video.performerId,
        excludedId: video._id,
        status: 'active',
        limit: 24
      });
    }
  }

  onUpdateStats() {
    const { video } = this.props;
    if (!video) return;
    this.setState({
      videoStats: video.stats,
      userReaction: video.userReaction,
      isBought: video.isBought,
      isSubscribed: video.isSubscribed
    });
    try {
      videoService.increaseView(video._id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  onChangeTab(videoId: string, tab: string) {
    const { isFirstLoadComment, itemPerPage, commentPage } = this.state;
    const { getComments: getCommentsHandler } = this.props;
    if (tab === 'comment' && isFirstLoadComment) {
      this.setState(
        {
          isFirstLoadComment: false
        },
        () => {
          getCommentsHandler({
            objectId: videoId,
            limit: itemPerPage,
            offset: commentPage
          });
        }
      );
    }
  }

  async onReaction(
    videoId: string,
    action: string,
    isCreated: boolean = false
  ) {
    const { user } = this.props;
    const { userReaction, videoStats } = this.state;
    if (user && user.isPerformer) return;
    try {
      if (!isCreated) {
        const react = await (
          await reactionService.create({
            objectId: videoId,
            action,
            objectType: 'video'
          })
        ).data;
        if (react) {
          if (action === 'like') {
            this.setState({
              userReaction: { ...userReaction, liked: true },
              videoStats: {
                ...videoStats,
                likes: videoStats.likes + 1
              }
            });
            message.success('Liked');
          }
          if (action === 'favourite') {
            message.success("Added to 'My Favourite'");
            this.setState({
              userReaction: { ...userReaction, favourited: true }
            });
          }
          if (action === 'watch_later') {
            message.success('Added to "My Wishlist"');
            this.setState({
              userReaction: { ...userReaction, watchedLater: true }
            });
          }
        }
      }
      if (isCreated) {
        const react = await await reactionService.delete({
          objectId: videoId,
          action,
          objectType: 'video'
        });
        if (react) {
          if (action === 'like') {
            this.setState({
              userReaction: { ...userReaction, liked: false },
              videoStats: {
                ...videoStats,
                likes: videoStats.likes - 1
              }
            });
            message.success('Unliked');
          }
          if (action === 'favourite') {
            message.success("Removed from 'My Favourite'");
            this.setState({
              userReaction: { ...userReaction, favourited: false }
            });
          }
          if (action === 'watch_later') {
            message.success('Removed from "My Wishlist"');
            this.setState({
              userReaction: { ...userReaction, watchedLater: false }
            });
          }
        }
      }
    } catch (e) {
      message.error(e.message || 'Error occured, please try again later');
    }
  }

  async onOpenComment() {
    const { video, getComments: handleGetComment } = this.props;
    const {
      isFirstLoadComment, itemPerPage, commentPage
    } = this.state;
    if (isFirstLoadComment) {
      await this.setState({ isFirstLoadComment: false });
      handleGetComment({
        objectId: video._id,
        limit: itemPerPage,
        offset: commentPage
      });
    }
  }

  async moreComment() {
    const { video, moreComment: handleLoadMore } = this.props;
    const { commentPage, itemPerPage } = this.state;
    await this.setState({
      commentPage: commentPage + 1
    });
    handleLoadMore({
      limit: itemPerPage,
      offset: (commentPage + 1) * itemPerPage,
      objectId: video._id
    });
  }

  async deleteComment(item) {
    const { deleteComment: handleDelete } = this.props;
    if (!window.confirm('Are you sure to remove this comment?')) return;
    handleDelete(item._id);
  }

  async buyVideo() {
    try {
      const { video } = this.props;
      const { isApplyCoupon, couponCode } = this.state;
      const data = isApplyCoupon && couponCode ? { couponCode, videoId: video._id } : { videoId: video._id };
      const pay = await (await paymentService.purchaseVideo(data)).data;
      // TOTO update logic here
      if (pay) {
        message.success('Redirecting to payment gateway');
        window.location.href = pay.paymentUrl;
      }
    } catch (e) {
      // console.log(e);
    }
  }

  async subscribe() {
    const { video } = this.props;
    try {
      await this.setState({ submiting: true });
      const subscription = await (
        await paymentService.subscribe({ type: this.subscriptionType, performerId: video.performerId })
      ).data;
      // throw success now
      if (subscription) {
        message.success('Redirecting to payment gateway');
        window.location.href = subscription.paymentUrl;
      }
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, pleasey try again later');
    } finally {
      this.setState({ submiting: false });
    }
  }

  async applyCoupon() {
    try {
      const { couponCode } = this.state;
      const resp = await paymentService.applyCoupon(couponCode);
      this.setState({ isApplyCoupon: true, coupon: resp.data });
      message.success('Coupon is applied');
    } catch (error) {
      const e = await error;
      message.error(
        e && e.message ? e.message : 'Error occured, please try again later'
      );
    }
  }

  async unApplyCoupon() {
    this.setState({ isApplyCoupon: false, coupon: null });
  }

  render() {
    const {
      user,
      ui,
      video,
      relatedVideos = {
        requesting: false,
        error: null,
        success: false,
        items: []
      },
      commentMapping, comment, createComment: handleCreateComment
    } = this.props;
    const { requesting: commenting } = comment;
    const fetchingComment = commentMapping.hasOwnProperty(video._id) ? commentMapping[video._id].requesting : false;
    const comments = commentMapping.hasOwnProperty(video._id) ? commentMapping[video._id].items : [];
    const totalComments = commentMapping.hasOwnProperty(video._id) ? commentMapping[video._id].total : video?.stats.comments;
    const { performer, video: videoSource } = video;
    const {
      videoStats,
      userReaction,
      isSubscribed,
      isBought,
      isApplyCoupon,
      coupon,
      couponCode,
      openSubscriptionModal,
      submiting
    } = this.state;

    const playSource = {
      file: videoSource && videoSource.url ? videoSource.url : '',
      image: video && video.thumbnail ? video.thumbnail : '/no-image.jpg'
    };
    const videoJsOptions = {
      autoplay: false,
      controls: true,
      playsinline: true,
      sources: [
        {
          src: playSource.file,
          type: 'video/mp4'
        }
      ]
    };

    const calTotal = (v: IVideoResponse, couponValue?: number) => {
      let total = v.price;
      if (couponValue) {
        total -= total * couponValue;
      }
      return total.toFixed(2) || 0;
    };

    return (
      <>
        <Head>
          <title>
            {ui && ui.siteName}
            {' '}
            |
            {' '}
            {video && video.title ? video.title : 'Video'}
          </title>
          <meta name="keywords" content={video && video.description} />
          <meta name="description" content={video && video.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={
              ui
              && `${ui.siteName} | ${video && video.title ? video.title : 'Video'}`
            }
            key="title"
          />
          <meta property="og:image" content={video && video.thumbnail} />
          <meta property="og:keywords" content={video && video.description} />
          <meta
            property="og:description"
            content={video && video.description}
          />
        </Head>
        <Layout>
          <div className="main-container">
            <div className="vid-title">{video.title}</div>
            <div className="vid-duration">
              <a>
                <HourglassOutlined />
                &nbsp;
                {videoDuration(video?.video?.duration || 0)}
              </a>
              <a>
                <EyeOutlined />
                &nbsp;
                {videoStats && videoStats.views ? videoStats.views : 0}
              </a>
            </div>
            <div className="vid-player">
              {((!video.isSale && isSubscribed)
                  || (video.isSale && isBought)) && (
                    <div className="main-player">
                      {playSource.file ? (
                        <VideoPlayer {...videoJsOptions} key={playSource.file} />
                      ) : (
                        <h3>No source found.</h3>
                      )}
                    </div>
              )}
              <div className="text-center">
                {video.isSale && !isBought && (
                <div className="coupon-form">
                  <Row>
                    <Col xs={24} md={12} sm={10}>
                      <Input
                        placeholder="Enter a coupon code"
                        onChange={(value) => this.setState({
                          couponCode: value.currentTarget.value
                        })}
                        disabled={isApplyCoupon}
                      />
                    </Col>
                    <Col xs={12} md={4} sm={6}>
                      {!isApplyCoupon ? (
                        <Button
                          className="primary"
                          disabled={!couponCode}
                          block
                          onClick={() => this.applyCoupon()}
                        >
                          <strong>Apply coupon</strong>
                        </Button>
                      ) : (
                        <Button
                          className="primary"
                          block
                          onClick={() => this.unApplyCoupon()}
                        >
                          <strong>Use later</strong>
                        </Button>
                      )}
                    </Col>
                    <Col xs={12} md={8} sm={8}>
                      <Button
                        className="normal"
                        onClick={this.buyVideo.bind(this, video._id)}
                        block
                      >
                        <Space>
                          BUY ME
                          <span
                            className={
                                  isApplyCoupon
                                    ? 'discount-price'
                                    : 'initialPrice'
                                }
                          >
                            $
                            {calTotal(video)}
                          </span>
                          {isApplyCoupon && coupon && (
                          <span>
                            $
                            {calTotal(video, coupon.value)}
                          </span>
                          )}
                        </Space>
                      </Button>
                    </Col>
                  </Row>
                  <div style={{ marginBottom: '10px' }} />
                  <ThumbnailVideo
                    video={video}
                  />
                </div>
                )}
                {!video.isSale && !isSubscribed && (
                <div
                  style={{ padding: '25px 5px' }}
                  className="subscription"
                >
                  <h3>To view full content, subscribe me!</h3>
                  <div style={{ marginBottom: '25px' }}>
                    {video.performer && video.performer.monthlyPrice && (
                    <Button
                      className="primary"
                      style={{ marginRight: '15px' }}
                      disabled={submiting && this.subscriptionType === 'monthly'}
                      onClick={() => {
                        this.subscriptionType = 'monthly';
                        this.setState({ openSubscriptionModal: true });
                      }}
                    >
                      Subscribe Monthly $
                      {video.performer.monthlyPrice.toFixed(2)}
                    </Button>
                    )}
                    {video.performer && video.performer.yearlyPrice && (
                    <Button
                      className="btn btn-yellow"
                      disabled={submiting && this.subscriptionType === 'yearly'}
                      onClick={() => {
                        this.subscriptionType = 'yearly';
                        this.setState({ openSubscriptionModal: true });
                      }}
                    >
                      Subscribe Yearly $
                      {video.performer.yearlyPrice.toFixed(2)}
                    </Button>
                    )}
                  </div>
                  <ThumbnailVideo
                    video={video}
                  />
                </div>
                )}
              </div>
            </div>
          </div>
          <div className="vid-split">
            <div className="main-container">
              <div className="vid-act">
                <div className="act-btns">
                  <button
                    type="button"
                    className={
                        userReaction && userReaction.liked
                          ? 'react-btn liked'
                          : 'react-btn'
                      }
                    onClick={this.onReaction.bind(
                      this,
                      video._id,
                      'like',
                      userReaction.liked
                    )}
                  >
                    {videoStats?.likes || 0}
                    {' '}
                    <LikeOutlined />
                  </button>
                  <button
                    type="button"
                    className={
                        userReaction && userReaction.favourited
                          ? 'react-btn favourited'
                          : 'react-btn'
                      }
                    onClick={this.onReaction.bind(
                      this,
                      video._id,
                      'favourite',
                      userReaction.favourited
                    )}
                  >
                    <HeartOutlined />
                  </button>
                  <button
                    type="button"
                    className={
                        userReaction && userReaction.watchedLater
                          ? 'react-btn watch-later'
                          : 'react-btn'
                      }
                    onClick={this.onReaction.bind(
                      this,
                      video._id,
                      'watch_later',
                      userReaction.watchedLater
                    )}
                  >
                    <ClockCircleOutlined />
                  </button>
                </div>
                <div className="o-w-ner">
                  <Link
                    href={{
                      pathname: '/model/profile',
                      query: { username: video.performer.username }
                    }}
                    as={`/model/${video.performer.username}`}
                  >
                    <a>
                      <img
                        alt="performer avatar"
                        src={video.performer.avatar || '/user.png'}
                      />
                      {' '}
                      @
                      {video.performer.username}
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="vid-info">
            <div className="main-container">
              <div style={{ marginBottom: '15px' }}>
                {video.tags.length > 0
                    && video.tags.map((tag) => (
                      <Tag color="magenta" key={tag}>
                        {tag || 'tag'}
                      </Tag>
                    ))}
              </div>

              <Tabs
                defaultActiveKey="Video"
                onChange={this.onChangeTab.bind(this, video._id)}
              >
                <TabPane tab="Description" key="description">
                  <p>{video.description || 'No description...'}</p>
                </TabPane>
                <TabPane tab="Participants" key="participants">
                  <Row>
                    {video.participants && video.participants.length > 0 ? (
                      video.participants.map((per: IPerformer) => (
                        <Col xs={12} sm={12} md={6} lg={6} key={per._id}>
                          <Link
                            href={{
                              pathname: '/model/profile',
                              query: { username: per.username }
                            }}
                            as={`/model/${per.username}`}
                          >
                            <div key={per._id} className="participant-card">
                              <img
                                alt="avatar"
                                src={per.avatar || '/no-avatar.png'}
                              />
                              <div className="participant-info">
                                <h5>{per?.name || per?.username || 'N/A'}</h5>
                                <p>{per?.bio}</p>
                              </div>
                            </div>
                          </Link>
                        </Col>
                      ))
                    ) : (
                      <p>No info found.</p>
                    )}
                  </Row>
                </TabPane>
                <TabPane
                  tab={`Comment (${totalComments})`}
                  key="comment"
                >
                  <CommentForm
                    creator={user}
                    onSubmit={handleCreateComment.bind(this)}
                    objectId={video._id}
                    objectType="video"
                    requesting={commenting}
                  />
                  <ListComments
                    key={`list_comments_${video._id}_${comments.length}`}
                    requesting={fetchingComment}
                    comments={comments}
                    total={totalComments}
                    onDelete={this.deleteComment.bind(this)}
                    user={user}
                    canReply
                  />
                  {comments.length < totalComments && <p className="text-center"><a aria-hidden onClick={this.moreComment.bind(this)}>More comments...</a></p>}
                </TabPane>
              </Tabs>
            </div>
          </div>
          <div className="main-container">
            <div className="related-vid">
              <h4 className="ttl-1">You may also like</h4>
              {relatedVideos.requesting && <div className="text-center"><Spin /></div>}
              {!relatedVideos.requesting && (
              <RelatedListVideo videos={relatedVideos.items} />
              )}
            </div>
          </div>
          <Modal
            key="subscribe_performer"
            title={`Confirm ${this.subscriptionType} subscription ${performer.name}`}
            visible={openSubscriptionModal}
            confirmLoading={submiting}
            footer={null}
            onCancel={() => this.setState({ openSubscriptionModal: false })}
          >
            <ConfirmSubscriptionPerformerForm
              type={this.subscriptionType || 'monthly'}
              user={user}
              performer={performer}
              submiting={submiting}
              onFinish={this.subscribe.bind(this)}
            />
          </Modal>
          {submiting && <Loader />}
        </Layout>
      </>
    );
  }
}

const mapStates = (state: any) => {
  const { commentMapping, comment } = state.comment;
  return {
    user: { ...state.user.current },
    ui: { ...state.ui },
    relatedVideos: { ...state.video.relatedVideos },
    commentMapping,
    comment
  };
};

const mapDispatch = {
  getRelated,
  getComments,
  moreComment,
  createComment,
  deleteComment
};
export default connect(mapStates, mapDispatch)(VideoViewPage);
