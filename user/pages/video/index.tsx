/* eslint-disable no-prototype-builtins */
import {
  Layout, Tabs, Button, Tag, message, Space, Row,
  Col, Alert, Modal, Spin, Tooltip
} from 'antd';
import {
  BookOutlined, EyeOutlined, HourglassOutlined, HeartOutlined
} from '@ant-design/icons';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import {
  videoService, reactionService, purchaseTokenService, paymentService
} from '@services/index';
import {
  RelatedListVideo,
  VideoPlayer,
  ThumbnailVideo,
  PurchaseVideoForm
} from '@components/video';
import { ListComments, CommentForm } from '@components/comment';
import Link from 'next/link';
import './video.less';
import Router from 'next/router';
import { videoDuration } from '@lib/index';
import { updateBalance } from '@redux/user/actions';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import Loader from '@components/common/base/loader';
import {
  IVideoResponse,
  IUser,
  IUIConfig,
  IPerformer
} from '../../src/interfaces';
import {
  getComments,
  moreComment,
  createComment,
  deleteComment
} from '../../src/redux/comment/actions';
import { getRelated } from '../../src/redux/video/actions';

const { TabPane } = Tabs;

interface IProps {
  query: any;
  user: IUser;
  relatedVideos: any;
  commentMapping: any;
  comment: any;
  getRelated: Function;
  getComments: Function;
  moreComment: Function;
  createComment: Function;
  ui: IUIConfig;
  video: IVideoResponse;
  deleteComment: Function;
  updateBalance: Function;
}

class VideoViewPage extends PureComponent<IProps> {
  static authenticate: boolean = true;

  static noredirect = true;

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
      return { ctx };
    } catch (e) {
      return {
        query
      };
    }
  }

  state = {
    videoStats: {
      likes: 0, comments: 0, views: 0, bookmarks: 0
    },
    userReaction: { liked: false, bookmarked: false },
    itemPerPage: 24,
    commentPage: 0,
    isFirstLoadComment: true,
    isBought: false,
    isSubscribed: false,
    totalComment: 0,
    submiting: false,
    openSubscriptionModal: false,
    openPurchaseModal: false
  };

  componentDidMount() {
    const { video, getRelated: handleGetRelated } = this.props;
    if (!video || !video._id) {
      return Router.back();
    }
    this.setState({
      videoStats: video.stats,
      userReaction: video.userReaction,
      isBought: video.isBought,
      isSubscribed: video.isSubscribed
    });
    videoService.increaseView(video._id);
    return handleGetRelated({
      performerId: video.performerId,
      excludedId: video._id,
      status: 'active',
      limit: 24
    });
  }

  componentDidUpdate(prevProps) {
    const {
      video, commentMapping, comment, getRelated: handleGetRelated
    } = this.props;
    const { totalComment } = this.state;
    if (prevProps.video._id !== video._id) {
      videoService.increaseView(video._id);
      handleGetRelated({
        performerId: video.performerId,
        excludedId: video._id,
        status: 'active',
        limit: 24
      });
    }
    if (
      (!prevProps.comment.data
        && comment.data
        && comment.data.objectId === video._id)
      || (prevProps.commentMapping[video._id]
        && totalComment !== commentMapping[video._id].total)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ totalComment: commentMapping[video._id].total });
    }
  }

  onChangeTab(tab: string) {
    const { isFirstLoadComment, itemPerPage } = this.state;
    const { getComments: handleGetComments, video } = this.props;
    if (tab === 'comment' && isFirstLoadComment) {
      this.setState(
        {
          isFirstLoadComment: false,
          commentPage: 0
        },
        () => {
          handleGetComments({
            objectId: video._id,
            objectType: 'video',
            limit: itemPerPage,
            offset: 0
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
    const { userReaction, videoStats } = this.state;
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
          if (action === 'book_mark') {
            message.success('Added to Bookmarks');
            this.setState({
              userReaction: { ...userReaction, bookmarked: true },
              videoStats: {
                ...videoStats,
                bookmarks: videoStats.bookmarks + 1
              }
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
          if (action === 'book_mark') {
            message.success('Removed from Bookmarks');
            this.setState({
              userReaction: { ...userReaction, bookmarked: false },
              videoStats: {
                ...videoStats,
                bookmarks: videoStats.bookmarks - 1
              }
            });
          }
        }
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    }
  }

  async onSubmitComment(values: any) {
    const { createComment: handleComment } = this.props;
    handleComment(values);
  }

  loadMoreComment = async (videoId: string) => {
    const { moreComment: handleMoreComment } = this.props;
    const { itemPerPage, commentPage } = this.state;
    await this.setState({
      commentPage: commentPage + 1
    });
    handleMoreComment({
      limit: itemPerPage,
      objectType: 'video',
      offset: (commentPage + 1) * itemPerPage,
      objectId: videoId
    });
  };

  async deleteComment(item) {
    const { deleteComment: handleDeleteComment } = this.props;
    if (!window.confirm('Are you sure to remove this comment?')) return;
    handleDeleteComment(item._id);
  }

  async purchaseVideo() {
    const { video, user, updateBalance: handleUpdateBalance } = this.props;
    if (!user._id || user.isPerformer) {
      message.error('Forbiden');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await (await purchaseTokenService.purchaseVideo(video._id, {})).data;
      message.success('Video is unlocked!');
      handleUpdateBalance({ token: video.price });
      this.setState({ isBought: true, openPurchaseModal: false });
    } catch (e) {
      const error = await e;
      this.setState({ submiting: false, openPurchaseModal: false });
      message.error(error.message || 'Error occured, please try again later');
    }
  }

  async subscribe() {
    try {
      const { video, user } = this.props;
      if (!user._id) {
        message.error('Please log in');
        Router.push('/auth/login');
        return;
      }
      if (!user.stripeCardIds || !user.stripeCardIds.length) {
        message.error('Please add payment card');
        Router.push('/user/cards');
        return;
      }
      await this.setState({ submiting: true });
      await paymentService.subscribePerformer({
        type: this.subscriptionType,
        performerId: video.performerId,
        paymentGateway: 'stripe',
        stripeCardId: user.stripeCardIds[0]
      });
      this.setState({ openSubscriptionModal: false });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured, please try again later');
      this.setState({ openSubscriptionModal: false, submiting: false });
    }
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
      commentMapping,
      comment
    } = this.props;
    const { performer } = video;
    const { requesting: commenting } = comment;
    const fetchingComment = commentMapping.hasOwnProperty(video._id)
      ? commentMapping[video._id].requesting
      : false;
    const comments = commentMapping.hasOwnProperty(video._id)
      ? commentMapping[video._id].items
      : [];
    const totalComments = commentMapping.hasOwnProperty(video._id)
      ? commentMapping[video._id].total
      : 0;
    const {
      videoStats,
      userReaction,
      isSubscribed,
      isBought,
      totalComment,
      openSubscriptionModal,
      openPurchaseModal,
      submiting
    } = this.state;

    const playSource = {
      file: video && video.video && video.video.url ? video.video.url : '',
      image: video && video.thumbnail ? video.thumbnail : '',
      teaser: video && video.teaser ? video.teaser : ''
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
    const teaserOptions = {
      autoplay: false,
      controls: true,
      playsinline: true,
      sources: [
        {
          src: playSource.teaser,
          type: 'video/mp4'
        }
      ]
    };

    return (
      <Layout>
        <Head>
          <title>
            {ui?.siteName}
            {' '}
            |
            {' '}
            {video?.title || 'Video'}
          </title>
          <meta name="keywords" content={video?.description} />
          <meta name="description" content={video?.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={
              ui
              && `${ui.siteName} | ${video?.title || 'Video'}`
            }
            key="title"
          />
          <meta property="og:image" content={video?.thumbnail} />
          <meta property="og:keywords" content={video?.description} />
          <meta
            property="og:description"
            content={video && video.description}
          />
        </Head>
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
              {videoStats?.views || 0}
            </a>
          </div>
          <div className="vid-player">
            <div className="main-player">
              {(((video.isSale && !isBought) || (!video.isSale && !isSubscribed))) && video.teaser && (
                <>
                  <VideoPlayer {...teaserOptions} />
                  <Alert type="error" message="You've watching the teaser video, let's subscribe model or purchase it to access full content." />
                </>
              )}
            </div>
            {((!video.isSale && isSubscribed)
              || (video.isSale && isBought)) && (
                <div className="main-player">
                  {video && video.video && video.video.url ? (
                    <VideoPlayer {...videoJsOptions} />
                  ) : (
                    <h3>No source found.</h3>
                  )}
                  {video.processing && <Alert type="error" message="Video file is currently on processing..." />}
                </div>
            )}
            <div className="text-center">
              {video.isSale && !isBought && (
                <div className="coupon-form">
                  <Button
                    className="primary"
                    onClick={() => this.setState({ openPurchaseModal: true })}
                  >
                    <Space>
                      Unlock video by $
                      {' '}
                      <img alt="coin" src="/static/coin-ico.png" height="20px" />
                      {(video.price || 0).toFixed(2)}
                    </Space>
                  </Button>
                  <div style={{ marginBottom: '10px' }} />
                  <ThumbnailVideo
                    video={video}
                  />
                  {video.processing === true && (<Alert type="success" message="Video converting, please wait" />)}
                </div>
              )}
              {!video.isSale && !isSubscribed && (
                <div
                  style={{ padding: '25px 5px' }}
                  className="subscription"
                >
                  <h3>To view full content, subscribe me!</h3>
                  <div style={{ marginBottom: '25px' }}>
                    {video.performer && video.performer.isFreeSubscription && (
                    <Button
                      className="primary"
                      style={{ marginRight: '15px' }}
                      onClick={() => {
                        this.subscriptionType = 'free';
                        this.setState({ openSubscriptionModal: true });
                      }}
                    >
                      SUBSCRIBE FOR FREE
                    </Button>
                    )}
                    {video.performer && !video.performer.isFreeSubscription && video.performer.monthlyPrice && (
                      <Button
                        className="primary"
                        style={{ marginRight: '15px' }}
                        onClick={() => {
                          this.subscriptionType = 'monthly';
                          this.setState({ openSubscriptionModal: true });
                        }}
                      >
                        MONTHLY SUBSCRIPTION BY $
                        {video.performer?.monthlyPrice.toFixed(2)}
                      </Button>
                    )}
                    {video.performer && !video.performer.isFreeSubscription && video.performer.yearlyPrice && (
                      <Button
                        className="btn btn-yellow"
                        onClick={() => {
                          this.subscriptionType = 'yearly';
                          this.setState({ openSubscriptionModal: true });
                        }}
                      >
                        YEARLY SUBSCRIPTION BY $
                        {video?.performer?.yearlyPrice.toFixed(2)}
                      </Button>
                    )}
                  </div>
                  <ThumbnailVideo video={video} />
                  {video.processing === true && (<Alert type="success" message="Video is on progressing, please wait" />)}
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
                      ? 'react-btn active'
                      : 'react-btn'
                  }
                  onClick={this.onReaction.bind(
                    this,
                    video._id,
                    'like',
                    userReaction.liked
                  )}
                >
                  {videoStats?.likes > 0 && videoStats?.likes}
                  {' '}
                  <HeartOutlined />
                </button>
                <button
                  type="button"
                  className={
                    userReaction && userReaction.bookmarked
                      ? 'react-btn active'
                      : 'react-btn'
                  }
                  onClick={this.onReaction.bind(
                    this,
                    video._id,
                    'book_mark',
                    userReaction.bookmarked
                  )}
                >
                  <Tooltip title={!userReaction.bookmarked ? 'Add to Bookmarks' : 'Remove from Bookmarks'}>
                    {videoStats?.bookmarks > 0 && videoStats?.bookmarks}
                    {' '}
                    <BookOutlined />
                  </Tooltip>
                </button>
              </div>
              <div className="o-w-ner">
                <Link
                  href={{
                    pathname: '/model/profile',
                    query: { username: video?.performer?.username || video?.performer?._id }
                  }}
                  as={`/model/${video?.performer?.username || video?.performer?._id}`}
                >
                  <>
                    <img
                      alt="performer avatar"
                      src={video?.performer?.avatar || '/static/no-avatar.png'}
                    />
                    {' '}
                    <div className="owner-name">
                      <div>{video?.performer?.name || 'N/A'}</div>
                      <small>
                        @
                        {video?.performer?.username || 'n/a'}
                      </small>
                    </div>
                  </>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="vid-info">
          <div className="main-container">
            <div style={{ marginBottom: '15px' }}>
              {video.tags && video.tags.length > 0
                && video.tags.map((tag) => (
                  <Tag color="magenta" key={tag}>
                    <Link href={{ pathname: '/search', query: { type: 'video', q: tag } }} as={`/search?q=${tag}&type=video`}>
                      <a>
                        #
                        {tag}
                      </a>
                    </Link>
                  </Tag>
                ))}
            </div>

            <Tabs
              defaultActiveKey="Video"
              onChange={this.onChangeTab.bind(this)}
              className="custom"
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
                            query: { username: per?.username || per?._id }
                          }}
                          as={`/model/${per?.username || per?._id}`}
                        >
                          <div key={per._id} className="participant-card">
                            <img
                              alt="per_atv"
                              src={per?.avatar || '/no-avatar.png'}
                            />
                            <div className="participant-info">
                              <h5>{per?.name || per?.username}</h5>
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
                tab={`Comment (${totalComment
                  || (videoStats && videoStats.comments
                    ? videoStats.comments
                    : 0)
                })`}
                key="comment"
              >
                <CommentForm
                  creator={user}
                  onSubmit={this.onSubmitComment.bind(this)}
                  objectId={video._id}
                  requesting={commenting}
                  objectType="video"
                />

                <ListComments
                  key={`list_comments_${comments.length}`}
                  requesting={fetchingComment}
                  comments={comments}
                  total={totalComments}
                  onDelete={this.deleteComment.bind(this)}
                  user={user}
                  canReply
                />

                {comments.length < totalComments && (
                  <p className="text-center">
                    <a aria-hidden onClick={this.loadMoreComment.bind(this)}>
                      More comments
                    </a>
                  </p>
                )}
              </TabPane>
            </Tabs>
          </div>
        </div>
        <div className="main-container">
          <div className="related-vid">
            <h4 className="ttl-1">You may also like</h4>
            {relatedVideos.requesting && <div className="text-center"><Spin /></div>}
            {relatedVideos.items.length > 0 && !relatedVideos.requesting && (
              <RelatedListVideo videos={relatedVideos.items} />
            )}
            {!relatedVideos.items.length && !relatedVideos.requesting && (
              <p>No data was found</p>
            )}
          </div>
        </div>
        <Modal
          key="subscribe_performer"
          title={`Confirm ${this.subscriptionType} subscription ${performer?.name || performer?.username}`}
          visible={openSubscriptionModal}
          confirmLoading={submiting}
          footer={null}
          width={500}
          className="subscription-modal"
          onCancel={() => this.setState({ openSubscriptionModal: false })}
        >
          <ConfirmSubscriptionPerformerForm
            type={this.subscriptionType || 'monthly'}
            performer={performer}
            submiting={submiting}
            onFinish={this.subscribe.bind(this)}
          />
        </Modal>
        <Modal
          key="purchase_post"
          title={`Unlock ${performer.name} post`}
          visible={openPurchaseModal}
          footer={null}
          onCancel={() => this.setState({ openPurchaseModal: false })}
        >
          <PurchaseVideoForm video={video} submiting={submiting} onFinish={this.purchaseVideo.bind(this)} />
        </Modal>
        {submiting && <Loader customText="Your payment is on processing, do not reload page until its done" />}
      </Layout>
    );
  }
}
const mapStates = (state: any) => {
  const { commentMapping, comment } = state.comment;
  return {
    relatedVideos: { ...state.video.relatedVideos },
    commentMapping,
    comment,
    user: { ...state.user.current },
    ui: { ...state.ui }
  };
};

const mapDispatch = {
  getRelated,
  getComments,
  moreComment,
  createComment,
  deleteComment,
  updateBalance
};
export default connect(mapStates, mapDispatch)(VideoViewPage);
