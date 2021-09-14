/* eslint-disable no-nested-ternary */
/* eslint-disable no-prototype-builtins */
import {
  Layout, Tabs, message, Button, Spin, Tooltip
} from 'antd';
import {
  BookOutlined, EyeOutlined, HourglassOutlined, LikeOutlined, CommentOutlined,
  CalendarOutlined, VideoCameraOutlined
} from '@ant-design/icons';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import {
  videoService, reactionService, purchaseTokenService, paymentService
} from '@services/index';
import {
  RelatedListVideo
} from '@components/video';
import { VideoPlayer } from '@components/common/video-player';
import { ListComments, CommentForm } from '@components/comment';
import Link from 'next/link';
import Router from 'next/router';
import Error from 'next/error';
import { videoDuration, shortenLargeNumber, formatDate } from '@lib/index';
import { updateBalance } from '@redux/user/actions';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import PageHeading from '@components/common/page-heading';
import Loader from '@components/common/base/loader';
import {
  IVideoResponse, IUser, IUIConfig, IPerformer
} from 'src/interfaces';
import {
  getComments, moreComment, createComment, deleteComment
} from 'src/redux/comment/actions';
import { getRelated } from 'src/redux/video/actions';
import './index.less';

const { TabPane } = Tabs;

interface IProps {
  query: any;
  error: any;
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
  static authenticate = true;

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
      return { video };
    } catch (e) {
      return { error: await e };
    }
  }

  state = {
    videoStats: {
      likes: 0, comments: 0, views: 0, bookmarks: 0
    },
    isLiked: false,
    isBookmarked: false,
    itemPerPage: 24,
    commentPage: 0,
    isFirstLoadComment: true,
    isBought: false,
    isSubscribed: false,
    totalComment: 0,
    submiting: false,
    activeTab: 'description'
  };

  componentDidMount() {
    const { video, getRelated: handleGetRelated } = this.props;
    this.setState({
      videoStats: video.stats,
      isLiked: video.isLiked,
      isBookmarked: video.isBookmarked,
      isBought: video.isBought,
      isSubscribed: video.isSubscribed
    });
    handleGetRelated({
      performerId: video.performerId,
      excludedId: video._id,
      limit: 24
    });
  }

  componentDidUpdate(prevProps) {
    const {
      video, commentMapping, comment, getRelated: handleGetRelated
    } = this.props;
    const { totalComment } = this.state;
    if (prevProps.video._id !== video._id) {
      handleGetRelated({
        performerId: video.performerId,
        excludedId: video._id,
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
    this.setState({ activeTab: tab });
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

  async onReaction(action: string) {
    const { videoStats, isLiked, isBookmarked } = this.state;
    const { video } = this.props;
    try {
      if (action === 'like') {
        !isLiked ? await reactionService.create({
          objectId: video._id,
          action,
          objectType: 'video'
        }) : await reactionService.delete({
          objectId: video._id,
          action,
          objectType: 'video'
        });
        this.setState({
          isLiked: !isLiked,
          videoStats: {
            ...videoStats,
            likes: videoStats.likes + 1
          }
        });
        message.success(!isLiked ? 'Liked' : 'Unliked');
      }
      if (action === 'book_mark') {
        !isBookmarked ? await reactionService.create({
          objectId: video._id,
          action,
          objectType: 'video'
        }) : await reactionService.delete({
          objectId: video._id,
          action,
          objectType: 'video'
        });
        message.success(!isBookmarked ? 'Added to Bookmarks' : 'Remove form Bookmarks');
        this.setState({
          isBookmarked: !isBookmarked,
          videoStats: {
            ...videoStats,
            bookmarks: videoStats.bookmarks + 1
          }
        });
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
      this.setState({ isBought: true });
    } catch (e) {
      const error = await e;
      this.setState({ submiting: false });
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
      const subscriptionType = video.performer.isFreeSubscription ? 'free' : 'monthly';
      await this.setState({ submiting: true });
      await paymentService.subscribePerformer({
        type: subscriptionType,
        performerId: video.performerId,
        paymentGateway: 'stripe',
        stripeCardId: user.stripeCardIds[0]
      });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'Error occured, please try again later');
      this.setState({ submiting: false });
    }
  }

  render() {
    const {
      user,
      error,
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
    if (error) {
      return <Error statusCode={error?.statusCode || 404} title={error?.message || 'Not found'} />;
    }
    const { requesting: commenting } = comment;
    const fetchingComment = commentMapping.hasOwnProperty(video._id) ? commentMapping[video._id].requesting : false;
    const comments = commentMapping.hasOwnProperty(video._id) ? commentMapping[video._id].items : [];
    const totalComments = commentMapping.hasOwnProperty(video._id) ? commentMapping[video._id].total : 0;
    const {
      videoStats,
      isLiked,
      isBookmarked,
      isSubscribed,
      isBought,
      submiting,
      activeTab,
      isFirstLoadComment
    } = this.state;
    const thumbUrl = (video?.thumbnail?.thumbnails && video?.thumbnail?.thumbnails[0]) || video?.thumbnail?.url || (video?.teaser?.thumbnails && video?.teaser?.thumbnails[0]) || (video?.video?.thumbnails && video?.video?.thumbnails[0]) || '/static/placeholder-image.jpg';
    const playSource = {
      file: video?.video?.url || '',
      image: thumbUrl,
      teaser: video?.teaser?.url || ''
    };
    const videoJsOptions = {
      key: video._id,
      autoplay: true,
      controls: true,
      playsinline: true,
      poster: thumbUrl,
      sources: [
        {
          src: playSource.file,
          type: 'video/mp4'
        }
      ]
    };
    const teaserOptions = {
      key: video._id,
      autoplay: true,
      controls: true,
      poster: thumbUrl,
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
            {ui.siteName}
            {' '}
            |
            {' '}
            {video.title || 'Video'}
          </title>
          <meta name="keywords" content={video.description} />
          <meta name="description" content={video.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={
              ui
              && `${ui.siteName} | ${video.title || 'Video'}`
            }
            key="title"
          />
          <meta property="og:image" content={thumbUrl} />
          <meta property="og:keywords" content={video.description} />
          <meta
            property="og:description"
            content={video.description}
          />
        </Head>
        <div className="main-container">
          <PageHeading icon={<VideoCameraOutlined />} title={video.title || 'Video'} />
          <div className="vid-duration">
            <a>
              <EyeOutlined />
              &nbsp;
              {shortenLargeNumber(videoStats.views || 0)}
            </a>
            <a>
              <HourglassOutlined />
              &nbsp;
              {videoDuration(video?.video?.duration || 0)}
            </a>
            <a>
              <CalendarOutlined />
              &nbsp;
              {formatDate(video.updatedAt, 'LL')}
            </a>
          </div>
          <div className="vid-player">
            {((video.isSale && !isBought) || (!video.isSale && !isSubscribed) || video.isSchedule) && (
            <div className="main-player">
              <div className="vid-group">
                <div className="left-group">
                  {video.teaser && video.teaserProcessing && (
                  <div
                    className="text-center"
                    style={{
                      position: 'absolute', top: 0, padding: 10, zIndex: 1
                    }}
                  >
                    Teaser is currently on processing
                    {' '}
                    <Spin />
                  </div>
                  )}
                  {video.teaser && !video.teaserProcessing && <VideoPlayer {...teaserOptions} />}
                  {!video.teaser && (
                    <div className="video-thumbs">
                      <img alt="thumbnail" src={thumbUrl} />
                    </div>
                  )}
                  <div className="vid-exl-group">
                    <h3>{(video.isSale && !isBought && !video.isSchedule) ? 'UNLOCK TO VIEW FULL CONTENT' : (!video.isSale && !isSubscribed && !video.isSchedule) ? 'SUBSCRIBE TO VIEW FULL CONTENT' : 'VIDEO IS UPCOMING'}</h3>
                    <div className="text-center">
                      {video.isSale && !isBought && (
                      <Button type="primary" loading={submiting} disabled={submiting} onClick={this.purchaseVideo.bind(this)}>
                        UNLOCK VIDEO BY
                        {' '}
                        {video.price.toFixed(2)}
                        {' '}
                        <img alt="token" src="/static/coin-ico.png" height="25px" />
                      </Button>
                      )}
                      {!video.isSale && !isSubscribed && (
                      <ConfirmSubscriptionPerformerForm
                        type={video?.performer?.isFreeSubscription ? 'free' : 'monthly'}
                        performer={video.performer}
                        submiting={submiting}
                        onFinish={this.subscribe.bind(this)}
                      />
                      )}
                    </div>
                    {video.isSchedule && (
                    <h4>
                      Main video will be premiered at
                      {' '}
                      {formatDate(video.scheduledAt, 'LL')}
                    </h4>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
            {((!video.isSale && isSubscribed && !video.isSchedule) || (video.isSale && isBought && !video.isSchedule)) && (
            <div className="main-player">
              <div className="vid-group">
                {video.processing ? (
                  <div
                    className="text-center"
                    style={{
                      position: 'absolute', top: 0, padding: 10, zIndex: 1
                    }}
                  >
                    Video file is currently on processing
                    {' '}
                    <Spin />
                  </div>
                ) : <VideoPlayer {...videoJsOptions} />}
              </div>
            </div>
            )}
          </div>
        </div>
        <div className="vid-split">
          <div className="main-container">
            <div className="vid-act">
              <Link
                href={{
                  pathname: '/model/profile',
                  query: { username: video?.performer?.username || video?.performer?._id }
                }}
                as={`/${video?.performer?.username || video?.performer?._id}`}
              >
                <a>
                  <div className="o-w-ner">
                    <img
                      alt="performer avatar"
                      src={video?.performer?.avatar || '/static/no-avatar.png'}
                    />
                    {' '}
                    <span className="owner-name">
                      <div>{video?.performer?.name || 'N/A'}</div>
                      <small>
                        @
                        {video?.performer?.username || 'n/a'}
                      </small>
                    </span>
                  </div>
                </a>
              </Link>
              <div className="act-btns">
                <button
                  type="button"
                  className={isLiked ? 'react-btn active' : 'react-btn'}
                  onClick={this.onReaction.bind(this, 'like')}
                >
                  {shortenLargeNumber(videoStats.likes || 0)}
                  {' '}
                  <LikeOutlined />
                </button>
                <button
                  type="button"
                  className={isBookmarked ? 'react-btn active' : 'react-btn'}
                  onClick={this.onReaction.bind(this, 'book_mark')}
                >
                  {shortenLargeNumber(videoStats.bookmarks || 0)}
                  {' '}
                  <BookOutlined />
                </button>
                <button
                  onClick={() => this.setState({ activeTab: 'comment' })}
                  type="button"
                  className={activeTab === 'comment' ? 'react-btn active' : 'react-btn'}
                >
                  {!isFirstLoadComment && !fetchingComment ? shortenLargeNumber(videoStats.comments || 0) : shortenLargeNumber(totalComments)}
                  {' '}
                  <CommentOutlined />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="main-container">
          <div className="vid-tags">
            {video.tags && video.tags.length > 0
                && video.tags.map((tag) => (
                  <a color="magenta" style={{ marginRight: 5 }}>
                    #
                    {tag}
                  </a>
                ))}
          </div>
          <Tabs
            defaultActiveKey="description"
            activeKey={activeTab}
            onChange={(tab) => this.onChangeTab(tab)}
            className="custom"
          >
            <TabPane tab="Description" key="description">
              <p>{video.description || 'No description...'}</p>
            </TabPane>
            <TabPane tab="Participants" key="participants">
              {video.participants && video.participants.length > 0 ? (
                video.participants.map((per: IPerformer) => (
                  <Link
                    key={per._id}
                    href={{
                      pathname: '/model/profile',
                      query: { username: per?.username || per?._id }
                    }}
                    as={`/${per?.username || per?._id}`}
                  >
                    <div key={per._id} className="participant-card">
                      <img
                        alt="per_atv"
                        src={per?.avatar || '/no-avatar.png'}
                      />
                      <div className="participant-info">
                        <h4>{per?.name || 'N/A'}</h4>
                        <h5>
                          @
                          {per?.username || 'n/a'}
                        </h5>
                        <Tooltip title={per?.bio}>
                          <div className="p-bio">
                            {per?.bio || 'No bio'}
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p>No profile was found.</p>
              )}
            </TabPane>
            <TabPane
              tab="Comments"
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
          <div className="related-items">
            <h4 className="ttl-1">You may also like</h4>
            {relatedVideos.requesting && <div className="text-center"><Spin /></div>}
            {relatedVideos.items.length > 0 && !relatedVideos.requesting && (
              <RelatedListVideo videos={relatedVideos.items} />
            )}
            {!relatedVideos.items.length && !relatedVideos.requesting && (
              <p>No video was found</p>
            )}
          </div>
        </div>
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
