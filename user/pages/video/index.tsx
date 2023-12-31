/* eslint-disable no-nested-ternary */
/* eslint-disable no-prototype-builtins */
import {
  Layout, Tabs, message, Button, Spin, Tooltip, Avatar, Modal
} from 'antd';
import {
  BookOutlined, EyeOutlined, HourglassOutlined, LikeOutlined, CommentOutlined,
  CalendarOutlined, VideoCameraOutlined, DollarOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import Head from 'next/head';
import {
  videoService, reactionService, tokenTransactionService
} from '@services/index';
import { setSubscription } from '@redux/subscription/actions';
import {
  getComments,
  moreComment,
  createComment,
  deleteComment
} from 'src/redux/comment/actions';
import { updateBalance } from '@redux/user/actions';
import { getRelated } from 'src/redux/video/actions';
import PageHeading from '@components/common/page-heading';
import { VideoPlayer } from '@components/common/video-player';
import ListComments from '@components/comment/list-comments';
import CommentForm from '@components/comment/comment-form';
import { videoDuration, shortenLargeNumber, formatDate } from '@lib/index';
import {
  IVideo, IUser, IUIConfig, IPerformer, ISettings
} from 'src/interfaces';
import Link from 'next/link';
import Router from 'next/router';
import Error from 'next/error';
import './index.less';
import { injectIntl, IntlShape } from 'react-intl';
import RelatedListVideo from '@components/video/related-list';
import TipPerformerForm from '@components/performer/tip-form';

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
  video: IVideo;
  deleteComment: Function;
  updateBalance: Function;
  intl: IntlShape;
  settings: ISettings;
  setSubscription: Function;
}

class VideoViewPage extends PureComponent<IProps> {
  static authenticate = true;

  static noredirect = true;

  static async getInitialProps({ ctx }) {
    const { query } = ctx;
    try {
      const video = await (
        await videoService.findOne(query.id, {
          Authorization: ctx.token
        })
      ).data;
      return { video };
    } catch (e) {
      return { error: await e };
    }
  }

  state = {
    videoStats: {
      likes: 0,
      comments: 0,
      views: 0,
      bookmarks: 0
    },
    isLiked: false,
    isBookmarked: false,
    itemPerPage: 24,
    commentPage: 0,
    isFirstLoadComment: true,
    isBought: false,
    isSubscribed: false,
    totalComment: 0,
    requesting: false,
    activeTab: 'description',
    openTipModal: false
  };

  componentDidMount() {
    this.onShallowRouteChange();
  }

  componentDidUpdate(prevProps) {
    const { video, commentMapping, comment } = this.props;
    const { totalComment } = this.state;
    if (prevProps.video._id !== video._id) {
      this.onShallowRouteChange();
    }
    if (
      (!prevProps.comment.data && comment.data && comment.data.objectId === video._id) || (prevProps.commentMapping[video._id] && totalComment !== commentMapping[video._id].total)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ totalComment: commentMapping[video._id].total });
    }
  }

  onShallowRouteChange() {
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
    const { video, intl } = this.props;
    try {
      if (action === 'like') {
        !isLiked
          ? await reactionService.create({
            objectId: video._id,
            action,
            objectType: 'video'
          })
          : await reactionService.delete({
            objectId: video._id,
            action,
            objectType: 'video'
          });
        this.setState({
          isLiked: !isLiked,
          videoStats: {
            ...videoStats,
            likes: videoStats.likes + (isLiked ? -1 : 1)
          }
        });
        message.success(!isLiked ? 'Liked' : 'Unliked');
      }
      if (action === 'book_mark') {
        !isBookmarked
          ? await reactionService.create({
            objectId: video._id,
            action,
            objectType: 'video'
          })
          : await reactionService.delete({
            objectId: video._id,
            action,
            objectType: 'video'
          });
        message.success(
          !isBookmarked
            ? intl.formatMessage({
              id: 'addedToBookmarks',
              defaultMessage: 'Added to Bookmarks'
            })
            : intl.formatMessage({
              id: 'removedFromBookmarks',
              defaultMessage: 'Removed from Bookmarks'
            })
        );
        this.setState({
          isBookmarked: !isBookmarked,
          videoStats: {
            ...videoStats,
            bookmarks: videoStats.bookmarks + (isBookmarked ? -1 : 1)
          }
        });
      }
    } catch (e) {
      const error = await e;
      message.error(
        error.message || intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
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

  sendTip = async (price) => {
    const { video, user, updateBalance: handleUpdateBalance } = this.props;
    if (user._id === video?.performer?._id) {
      message.error('Models cannot tip for themselves');
      return;
    }
    if (user.balance < price) {
      message.error('Your wallet balance is not enough');
      Router.push('/wallet');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await tokenTransactionService.sendTip(video?.performer?._id, { performerId: video?.performer?._id, price });
      message.success('Thank you for the tip');
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ requesting: false, openTipModal: false });
    }
  }

  async deleteComment(item) {
    const { intl } = this.props;
    const { deleteComment: handleDeleteComment } = this.props;
    if (!window.confirm(intl.formatMessage({
      id: 'areYouSureToRemoveThisComment',
      defaultMessage: 'Are you sure to remove this comment?'
    }))
    ) return;
    handleDeleteComment(item._id);
  }

  async purchaseVideo() {
    const {
      video, user, updateBalance: handleUpdateBalance, intl
    } = this.props;
    if (!user._id) {
      message.error(
        intl.formatMessage({
          id: 'pleaseLogIn',
          defaultMessage: 'Please log in!'
        })
      );
      Router.push('/auth/login');
      return;
    }
    if (user.isPerformer) {
      return;
    }
    try {
      await this.setState({ requesting: true });
      await (await tokenTransactionService.purchaseVideo(video._id, {})).data;
      message.success('Video is unlocked!');
      handleUpdateBalance({ token: -video.price });
      this.setState({ isBought: true, requesting: false });
    } catch (e) {
      const error = await e;
      this.setState({ requesting: false });
      message.error(
        error.message
        || intl.formatMessage({
          id: 'errorOccurredPleaseTryAgainLater',
          defaultMessage: 'Error occurred, please try again later'
        })
      );
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
      comment,
      setSubscription: updateSubscription,
      intl
    } = this.props;
    if (error) {
      return (
        <Error
          statusCode={error?.statusCode || 404}
          title={
            error?.message
            || intl.formatMessage({
              id: 'videoNotFoundMediaControl',
              defaultMessage: 'Video not found!'
            })
          }
        />
      );
    }
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
      videoStats, isLiked, isBookmarked, isSubscribed, isBought, requesting, activeTab, isFirstLoadComment, openTipModal
    } = this.state;
    const thumbUrl = video?.thumbnail?.url
      || (video?.teaser?.thumbnails && video?.teaser?.thumbnails[0])
      || (video?.video?.thumbnails && video?.video?.thumbnails[0])
      || '/static/no-image.jpg';
    const videoJsOptions = {
      key: video._id,
      autoplay: true,
      controls: true,
      playsinline: true,
      poster: thumbUrl,
      sources: [
        {
          src: video?.video?.url,
          type: 'video/mp4'
        }
      ]
    };
    const teaserOptions = {
      key: `${video._id}_teaser`,
      autoplay: true,
      controls: true,
      playsinline: true,
      sources: [
        {
          src: video?.teaser?.url,
          type: 'video/mp4'
        }
      ]
    };

    return (
      <Layout>
        <Head>
          <title>{`${ui.siteName} | ${video.title}`}</title>
          <meta name="description" content={video.description} />
          {/* OG tags */}
          <meta
            property="og:title"
            content={`${ui.siteName} | ${video.title
              || intl.formatMessage({ id: 'video', defaultMessage: 'Video' })}`}
          />
          <meta property="og:image" content={thumbUrl} />
          <meta property="og:description" content={video.description} />
          {/* Twitter tags */}
          <meta
            name="twitter:title"
            content={`${ui.siteName} | ${video.title
              || intl.formatMessage({ id: 'video', defaultMessage: 'Video' })}`}
          />
          <meta name="twitter:image" content={thumbUrl} />
          <meta name="twitter:description" content={video.description} />
        </Head>
        <div className="main-container">
          <PageHeading
            icon={<VideoCameraOutlined />}
            title={
              video.title
              || intl.formatMessage({ id: 'video', defaultMessage: 'Video' })
            }
          />
          <div className="vid-duration">
            <a>
              <HourglassOutlined />
              &nbsp;
              {videoDuration(video?.video?.duration || 0)}
              &nbsp;&nbsp;&nbsp;
              <EyeOutlined />
              &nbsp;
              {shortenLargeNumber(videoStats.views || 0)}
            </a>
            <a>
              <CalendarOutlined />
              &nbsp;
              {formatDate(video.updatedAt, 'll')}
            </a>
          </div>
          <div className="vid-player">
            {((video.isSale && !isBought) || (!video.isSale && !isSubscribed) || video.isSchedule) && (
            <div className="vid-group">
              {video.teaser && video.teaserProcessing && (
              <div className="vid-processing">
                <div className="text-center">
                  <Spin />
                  <br />
                  {intl.formatMessage({ id: 'teaserIsCurrentlyOnProcessing', defaultMessage: 'Teaser is currently on processing' })}
                </div>
              </div>
              )}
              {video.teaser && !video.teaserProcessing && <VideoPlayer {...teaserOptions} />}
              {!video.teaser && (
              <div className="video-thumbs">
                <img alt="thumbnail" src={thumbUrl} />
              </div>
              )}
              <div className="vid-exl-group">
                {/* eslint-disable-next-line no-nested-ternary */}
                <h3>
                  {video.isSale && !isBought && !video.isSchedule
                    ? intl.formatMessage({ id: 'unlockToViewFullContent', defaultMessage: 'UNLOCK TO VIEW FULL CONTENT' })
                    : !video.isSale && !isSubscribed && !video.isSchedule
                      ? intl.formatMessage({ id: 'subscribeToViewFullContent', defaultMessage: 'SUBSCRIBE TO VIEW FULL CONTENT' })
                      : intl.formatMessage({ id: 'videoIsUpcoming', defaultMessage: 'VIDEO IS UPCOMING' })}
                </h3>
                <div className="text-center">
                  {video.isSale && !isBought && (
                  <Button block className="primary" loading={requesting} disabled={requesting} onClick={this.purchaseVideo.bind(this)}>
                    {intl.formatMessage({ id: 'pay', defaultMessage: 'PAY' })}
                    {' '}
                    $
                    {video.price.toFixed(2)}
                    {' '}
                    {intl.formatMessage({ id: 'tuUnlock', defaultMessage: 'TO UNLOCK' })}
                  </Button>
                  )}
                  {!video.isSale && !isSubscribed && (
                  <div
                    style={{ padding: '0 10px' }}
                    className="subscription-btn-grp"
                  >
                      {video?.performer?.isFreeSubscription && (
                      <Button
                        className="primary"
                        disabled={!user._id}
                        onClick={() => {
                          updateSubscription({ showModal: true, performer: video?.performer, subscriptionType: 'free' });
                        }}
                      >
                        {intl.formatMessage({ id: 'subscribeForFreeFor', defaultMessage: 'SUBSCRIBE FOR FREE FOR' })}
                        {' '}
                        {video?.performer?.durationFreeSubscriptionDays || 1}
                        {' '}
                        {video?.performer?.durationFreeSubscriptionDays > 1 ? intl.formatMessage({ id: 'days', defaultMessage: 'DAYS' }) : intl.formatMessage({ id: 'day', defaultMessage: 'DAY' })}
                      </Button>
                      )}
                      {video?.performer?.monthlyPrice && (
                      <Button
                        className="primary"
                        disabled={!user || !user._id}
                        onClick={() => {
                          updateSubscription({ showModal: true, performer: video?.performer, subscriptionType: 'monthly' });
                        }}
                      >
                        {intl.formatMessage({ id: 'monthlySubscriptionFor', defaultMessage: 'MONTHLY SUBSCRIPTION FOR' })}
                        {' '}
                        $
                        {(video?.performer?.monthlyPrice || 0).toFixed(2)}
                      </Button>
                      )}
                      {video?.performer.yearlyPrice && (
                      <Button
                        className="secondary"
                        disabled={!user._id}
                        onClick={() => {
                          updateSubscription({ showModal: true, performer: video?.performer, subscriptionType: 'yearly' });
                        }}
                      >
                        {intl.formatMessage({ id: 'yearlySubscriptionFor', defaultMessage: 'YEARLY SUBSCRIPTION FOR' })}
                        {' '}
                        $
                        {(video?.performer?.yearlyPrice || 0).toFixed(2)}
                      </Button>
                      )}

                  </div>
                  )}
                </div>
                {video.isSchedule && (
                <h4>
                  {intl.formatMessage({ id: 'mainVideoWillBePremieredAt', defaultMessage: 'Main video will be premiered at' })}
                  {' '}
                  {formatDate(video.scheduledAt, 'll')}
                </h4>
                )}
              </div>
            </div>
            )}
            {((!video.isSale && isSubscribed && !video.isSchedule) || (video.isSale && isBought && !video.isSchedule)) && (
            <>
              {video.processing ? (
                <div className="vid-processing">
                  <div className="text-center">
                    <Spin />
                    <br />
                    {intl.formatMessage({ id: 'videoFileIsCurrentlyOnProcessing', defaultMessage: 'Video file is currently on processing' })}
                  </div>
                </div>
              ) : <VideoPlayer {...videoJsOptions} />}
            </>
            )}
          </div>
        </div>
        <div className="vid-split">
          <div className="main-container">
            <div className="vid-act">
              <Link
                href={{
                  pathname: '/model/profile',
                  query: {
                    username:
                      video?.performer?.username || video?.performer?._id
                  }
                }}
                as={`/${video?.performer?.username || video?.performer?._id}`}
              >
                <a>
                  <div className="o-w-ner">
                    <Avatar
                      alt="performer avatar"
                      src={video?.performer?.avatar || '/static/no-avatar.png'}
                    />
                    <div className="owner-name">
                      <div className="name">
                        {video?.performer?.name || 'N/A'}
                        {video?.performer?.verifiedAccount && <TickIcon />}
                      </div>
                      <small>
                        @
                        {video?.performer?.username || 'n/a'}
                      </small>
                    </div>
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
                  className={
                    activeTab === 'comment' ? 'react-btn active' : 'react-btn'
                  }
                >
                  {!isFirstLoadComment && !fetchingComment
                    ? shortenLargeNumber(videoStats.comments || 0)
                    : shortenLargeNumber(totalComments)}
                  {' '}
                  <CommentOutlined />
                </button>
                <Tooltip title="Send Tip">
                  <button
                    onClick={() => this.setState({ openTipModal: true })}
                    type="button"
                    className="react-btn"
                  >
                    <DollarOutlined />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        <div className="main-container">
          {video.tags && video.tags.length > 0 && (
            <div className="vid-tags">
              {video.tags.map((tag) => (
                <a color="magenta" key={tag} style={{ marginRight: 5 }}>
                  #
                  {tag || intl.formatMessage({ id: 'tag', defaultMessage: 'Tag' })}
                </a>
              ))}
            </div>
          )}
          <Tabs
            defaultActiveKey="description"
            activeKey={activeTab}
            onChange={(tab) => this.onChangeTab(tab)}
            className="custom"
          >
            <TabPane tab={intl.formatMessage({ id: 'description', defaultMessage: 'Description' })} key="description">
              <p>{video.description || `${intl.formatMessage({ id: 'noDescription', defaultMessage: 'No description' })}...`}</p>
            </TabPane>
            <TabPane tab={intl.formatMessage({ id: 'participants', defaultMessage: 'Participants' })} key="participants">
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
                        src={per?.avatar || '/static/no-avatar.png'}
                      />
                      <div className="participant-info">
                        <h4>
                          {per?.name || 'N/A'}
                          &nbsp;
                          {per?.verifiedAccount && <TickIcon />}
                        </h4>
                        <h5>
                          @
                          {per?.username || 'n/a'}
                        </h5>
                        <Tooltip title={per?.bio}>
                          <div className="p-bio">{per?.bio || intl.formatMessage({ id: 'noBioYet', defaultMessage: 'No bio yet' })}</div>
                        </Tooltip>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p>{intl.formatMessage({ id: 'noProfileWasFound', defaultMessage: 'No profile was found' })}</p>
              )}
            </TabPane>
            <TabPane tab={intl.formatMessage({ id: 'comments', defaultMessage: 'Comments' })} key="comment">
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
                    {intl.formatMessage({ id: 'moreComments', defaultMessage: 'More comments' })}
                  </a>
                </p>
              )}
            </TabPane>
          </Tabs>
          <div className="related-items">
            <h4 className="ttl-1">{intl.formatMessage({ id: 'youMayAlsoLike', defaultMessage: 'You may also like' })}</h4>
            {relatedVideos.requesting && (
              <div className="text-center">
                <Spin />
              </div>
            )}
            {relatedVideos.items.length > 0 && !relatedVideos.requesting && (
              <RelatedListVideo videos={relatedVideos.items} />
            )}
            {!relatedVideos.items.length && !relatedVideos.requesting && (
              <p>{intl.formatMessage({ id: 'noVideoFound', defaultMessage: 'No video found.' })}</p>
            )}
          </div>
        </div>
        <Modal
          key="tip_performer"
          className="tip-modal"
          title={null}
          width={600}
          visible={openTipModal}
          onOk={() => this.setState({ openTipModal: false })}
          footer={null}
          onCancel={() => this.setState({ openTipModal: false })}
        >
          <TipPerformerForm performer={video.performer} submiting={requesting} onFinish={this.sendTip.bind(this)} />
        </Modal>
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
    ui: { ...state.ui },
    settings: { ...state.settings }
  };
};

const mapDispatch = {
  getRelated,
  getComments,
  moreComment,
  createComment,
  deleteComment,
  updateBalance,
  setSubscription
};
export default injectIntl(connect(mapStates, mapDispatch)(VideoViewPage));
