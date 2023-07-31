/* eslint-disable no-prototype-builtins */
import { Component } from 'react';
import {
  Menu, Dropdown, Divider, message, Modal, Tooltip, Button, Avatar
} from 'antd';
import {
  HeartOutlined, CommentOutlined, BookOutlined, UnlockOutlined,
  MoreOutlined, DollarOutlined, LockOutlined, FlagOutlined,
  FileImageOutlined, VideoCameraOutlined, PushpinOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import Link from 'next/link';
import CommentForm from '@components/comment/comment-form';
import ListComments from '@components/comment/list-comments';
import {
  getComments, moreComment, createComment, deleteComment
} from '@redux/comment/actions';
import {
  formatDate, videoDuration, shortenLargeNumber, getResponseError
} from '@lib/index';
import {
  reactionService, feedService, tokenTransactionService, reportService
} from '@services/index';
import { connect } from 'react-redux';
import { setSubscription } from '@redux/subscription/actions';
import TipPerformerForm from '@components/performer/tip-form';
import ReactMomentCountDown from 'react-moment-countdown';
import moment from 'moment';
import { VideoPlayer } from '@components/common/video-player';
import ReportForm from '@components/report/report-form';
import Router from 'next/router';
import { updateBalance } from '@redux/user/actions';
import { IFeed, IUser } from 'src/interfaces';
import PurchaseFeedForm from './confirm-purchase';
import FeedSlider from './post-slider';
import './index.less';
// eslint-disable-next-line import/order
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  feed: IFeed;
  // eslint-disable-next-line react/require-default-props
  onDelete?: Function;
  user: IUser;
  updateBalance: Function;
  getComments: Function;
  moreComment: Function;
  createComment: Function;
  deleteComment: Function;
  commentMapping: any;
  comment: any;
  setSubscription: Function;
  intl: IntlShape;
}

class FeedCard extends Component<IProps> {
  state = {
    isOpenComment: false,
    isLiked: false,
    isBookMarked: false,
    isBought: false,
    totalLike: 0,
    totalComment: 0,
    isFirstLoadComment: true,
    itemPerPage: 10,
    commentPage: 0,
    isHovered: false,
    openTipModal: false,
    openPurchaseModal: false,
    openTeaser: false,
    polls: [],
    requesting: false,
    openReportModal: false,
    isPinned: false
  }

  componentDidMount() {
    const { feed } = this.props;
    if (feed) {
      this.setState({
        isLiked: feed.isLiked,
        isBookMarked: feed.isBookMarked,
        isBought: feed.isBought,
        totalLike: feed.totalLike,
        totalComment: feed.totalComment,
        polls: feed.polls ? feed.polls : [],
        isPinned: !!feed.isPinned
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { feed, commentMapping, comment } = this.props;
    const { totalComment } = this.state;
    if ((!prevProps.comment.data && comment.data && comment.data.objectId === feed._id)
      || (prevProps.commentMapping[feed._id] && totalComment !== commentMapping[feed._id].total)) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ totalComment: commentMapping[feed._id].total });
    }
  }

  handleJoinStream = () => {
    const { user, feed, intl } = this.props;
    if (!user._id) {
      message.error(intl.formatMessage({ id: 'pleaseLogInOrRegister', defaultMessage: 'Please log in or register!' }));
      return;
    }
    if (user.isPerformer) return;
    if (!feed?.isSubscribed) {
      message.error(intl.formatMessage({ id: 'pleaseSubscribeToThisModel', defaultMessage: 'Please subscribe to this model!' }));
      return;
    }
    Router.push({
      pathname: '/streaming/details',
      query: {
        performer: JSON.stringify(feed?.performer),
        username: feed?.performer?.username || feed?.performer?._id
      }
    }, `/streaming/${feed?.performer?.username || feed?.performer?._id}`);
  }

  handleLike = async () => {
    const { feed, intl } = this.props;
    const { isLiked, totalLike, requesting } = this.state;
    if (requesting) return;
    try {
      await this.setState({ requesting: true });
      if (!isLiked) {
        await reactionService.create({
          objectId: feed._id,
          action: 'like',
          objectType: 'feed'
        });
        this.setState({ isLiked: true, totalLike: totalLike + 1, requesting: false });
      } else {
        await reactionService.delete({
          objectId: feed._id,
          action: 'like',
          objectType: 'feed'
        });
        this.setState({ isLiked: false, totalLike: totalLike - 1, requesting: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
      this.setState({ requesting: false });
    }
  }

  handleBookmark = async () => {
    const { feed, user, intl } = this.props;
    const { isBookMarked, requesting } = this.state;
    if (requesting || !user._id || user.isPerformer) return;
    try {
      await this.setState({ requesting: true });
      if (!isBookMarked) {
        await reactionService.create({
          objectId: feed._id,
          action: 'book_mark',
          objectType: 'feed'
        });
        this.setState({ isBookMarked: true, requesting: false });
      } else {
        await reactionService.delete({
          objectId: feed._id,
          action: 'book_mark',
          objectType: 'feed'
        });
        this.setState({ isBookMarked: false, requesting: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
      this.setState({ requesting: false });
    }
  }

  handleReport = async (payload: any) => {
    const { feed, intl } = this.props;
    try {
      await this.setState({ requesting: true });
      await reportService.create({
        ...payload, target: 'feed', targetId: feed._id, performerId: feed.fromSourceId
      });
      message.success(intl.formatMessage({
        id: 'yourReportHasBeenSent',
        defaultMessage: 'Your report has been sent'
      }));
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
    } finally {
      this.setState({ requesting: false, openReportModal: false });
    }
  }

  onOpenComment = () => {
    const { feed, getComments: handleGetComment } = this.props;
    const {
      isOpenComment, isFirstLoadComment, itemPerPage, commentPage
    } = this.state;
    this.setState({ isOpenComment: !isOpenComment });
    if (isFirstLoadComment) {
      this.setState({ isFirstLoadComment: false });
      handleGetComment({
        objectId: feed._id,
        limit: itemPerPage,
        offset: commentPage
      });
    }
  }

  copyLink = () => {
    const { feed, intl } = this.props;
    const str = `${window.location.origin}/post/${feed?.slug || feed?._id}`;
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    message.success(intl.formatMessage({ id: 'copiedToClipboard', defaultMessage: 'Copied to clipboard' }));
  }

  moreComment = async () => {
    const { feed, moreComment: handleLoadMore } = this.props;
    const { commentPage, itemPerPage } = this.state;
    this.setState({
      commentPage: commentPage + 1
    });
    handleLoadMore({
      limit: itemPerPage,
      offset: (commentPage + 1) * itemPerPage,
      objectId: feed._id
    });
  }

  deleteComment = (item) => {
    const { intl, deleteComment: handleDelete } = this.props;
    if (!window.confirm(intl.formatMessage({ id: 'areYouSureToRemoveThisComment', defaultMessage: 'Are you sure to remove this comment?' }))) return;
    handleDelete(item._id);
  }

  sendTip = async (price) => {
    const {
      feed, user, updateBalance: handleUpdateBalance, intl
    } = this.props;
    if (user._id === feed?.performer?._id) {
      message.error(intl.formatMessage({
        id: 'modelsCannotTipForThemselves',
        defaultMessage: 'Models cannot tip for themselves'
      }));
      return;
    }
    if (user.balance < price) {
      message.error(intl.formatMessage({ id: 'Your wallet balance is not enough', defaultMessage: 'Your wallet balance is not enough' }));
      Router.push('/wallet');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await tokenTransactionService.sendTip(feed?.performer?._id, { performerId: feed?.performer?._id, price });
      message.success(intl.formatMessage({
        id: 'thankYouForTheTip',
        defaultMessage: 'Thank you for the tip'
      }));
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
    } finally {
      this.setState({ requesting: false, openTipModal: false });
    }
  }

  purchaseFeed = async () => {
    const {
      intl, feed, user, updateBalance: handleUpdateBalance
    } = this.props;
    if (user.balance < feed.price) {
      message.error(intl.formatMessage({ id: 'yourWalletBalanceIsNotEnough', defaultMessage: 'Your wallet balance is not enough' }));
      Router.push('/wallet');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await tokenTransactionService.purchaseFeed(feed._id, {});
      message.success(intl.formatMessage({
        id: 'unlockedSuccessfully',
        defaultMessage: 'Unlocked successfully!'
      }));
      this.setState({ isBought: true });
      handleUpdateBalance({ token: -feed.price });
    } catch (e) {
      const error = await e;
      message.error(error.message || intl.formatMessage({
        id: 'errorOccurredPleaseTryAgainLater',
        defaultMessage: 'Error occurred, please try again later'
      }));
    } finally {
      this.setState({ requesting: false, openPurchaseModal: false });
    }
  }

  votePoll = async (poll: any) => {
    const { feed, intl } = this.props;
    const { polls } = this.state;
    const isExpired = new Date(feed.pollExpiredAt) < new Date();
    if (isExpired) {
      message.error(intl.formatMessage({
        id: 'thePollIsNowClosed',
        defaultMessage: 'The poll is now closed'
      }));
      return;
    }
    if (!window.confirm('Vote it?')) return;
    try {
      await this.setState({ requesting: true });
      await feedService.votePoll(poll._id);
      const index = polls.findIndex((p) => p._id === poll._id);
      await this.setState((prevState: any) => {
        const newItems = [...prevState.polls];
        newItems[index].totalVote += 1;
        return { polls: newItems, requesting: false };
      });
    } catch (e) {
      const error = await e;
      message.error(error.message || intl.formatMessage({
        id: 'somethingWentWrong',
        defaultMessage: 'Something went wrong, please try again!'
      }));
      this.setState({ requesting: false });
    }
  }

  pinToProfile = async () => {
    const { feed } = this.props;
    try {
      const resp = await feedService.pinFeedProfile(feed._id);
      this.setState({ isPinned: resp.data.isPinned });
    } catch (e) {
      const err = await e;
      message.error(getResponseError(err));
    }
  }

  render() {
    const {
      feed, user, commentMapping, comment, onDelete: handleDelete, createComment: handleCreateComment,
      setSubscription: updateSubscription, intl
    } = this.props;
    const { performer } = feed;
    const { requesting: commenting } = comment;
    const fetchingComment = commentMapping.hasOwnProperty(feed._id) ? commentMapping[feed._id].requesting : false;
    const comments = commentMapping.hasOwnProperty(feed._id) ? commentMapping[feed._id].items : [];
    const totalComments = commentMapping.hasOwnProperty(feed._id) ? commentMapping[feed._id].total : 0;
    const {
      isOpenComment, isLiked, totalComment, totalLike, isHovered, isBought,
      openTipModal, openPurchaseModal, polls, isBookMarked,
      openTeaser, openReportModal, requesting, isPinned
    } = this.state;
    let canView = (!feed.isSale && feed.isSubscribed)
      || (feed.isSale && isBought)
      || feed.type === 'text'
      || (feed.isSale && !feed.price);

    if (!user?._id || (`${user?._id}` !== `${feed?.fromSourceId}` && user?.isPerformer)) {
      canView = false;
    }
    const images = feed.files && feed.files.filter((f) => f.type === 'feed-photo');
    const videos = feed.files && feed.files.filter((f) => f.type === 'feed-video');
    const thumbUrl = (feed?.thumbnail?.thumbnails && feed?.thumbnail?.thumbnails[0])
      || (images && images[0] && images[0]?.thumbnails && images[0]?.thumbnails[0])
      || (feed?.teaser && feed?.teaser?.thumbnails && feed?.teaser?.thumbnails[0])
      || (videos && videos[0] && videos[0]?.thumbnails && videos[0]?.thumbnails[0])
      || '/static/leaf.jpg';
    let totalVote = 0;
    polls && polls.forEach((poll) => {
      totalVote += poll.totalVote;
    });
    const menu = (
      <Menu key={`menu_${feed._id}`}>
        <Menu.Item key={`post_detail_${feed._id}`}>
          <Link href={{ pathname: '/post', query: { id: feed.slug || feed._id } }} as={`/post/${feed.slug || feed._id}`}>
            <a>
              {intl.formatMessage({ id: 'details', defaultMessage: 'Details' })}
            </a>
          </Link>
        </Menu.Item>
        {user._id === feed.fromSourceId && (
          <>
            <Menu.Item key={`edit_post_${feed._id}`}>
              <Link href={{ pathname: '/model/my-post/edit', query: { id: feed._id } }}>
                <a>
                  {intl.formatMessage({ id: 'editPost', defaultMessage: 'Edit Post' })}
                </a>
              </Link>
            </Menu.Item>
            <Menu.Item key={`pin_${feed._id}`}>
              <a aria-hidden onClick={() => this.pinToProfile()}>
                {`${isPinned
                  ? intl.formatMessage({ id: 'unpinFrom', defaultMessage: 'Unpin from' })
                  : intl.formatMessage({ id: 'pinTo', defaultMessage: 'Pin to' })} ${intl.formatMessage({ id: 'profile', defaultMessage: 'Profile' })}`}
              </a>
            </Menu.Item>
          </>
        )}
        <Menu.Item key={`copy_link_${feed._id}`} onClick={() => this.copyLink()}>
          <a>
            {intl.formatMessage({ id: 'copyLinkToClipboard', defaultMessage: 'Copy link to clipboard' })}
          </a>
        </Menu.Item>
        {user._id === feed.fromSourceId && <Divider style={{ margin: '10px 0' }} />}
        {user._id === feed.fromSourceId && (
          <Menu.Item key={`delete_post_${feed._id}`}>
            <a aria-hidden onClick={handleDelete.bind(this, feed)}>
              {intl.formatMessage({
                id: 'deletePost',
                defaultMessage: 'Delete post'
              })}
            </a>
          </Menu.Item>
        )}
      </Menu>
    );
    const dropdown = (
      <Dropdown overlay={menu}>
        <a aria-hidden className="dropdown-options" onClick={(e) => e.preventDefault()}>
          <MoreOutlined />
        </a>
      </Dropdown>
    );

    return (
      <div className="feed-card">
        <div className="feed-top">
          <Link href={{ pathname: '/model/profile', query: { username: performer?.username || performer?._id } }} as={`/${performer?.username || performer?._id}`}>
            <div className="feed-top-left">
              <Avatar alt="per_atv" src={performer?.avatar || '/static/no-avatar.png'} size={40} />
              <div className="feed-name">
                <h4>
                  {performer?.name || 'N/A'}
                  {' '}
                  {performer?.verifiedAccount && <TickIcon />}
                  &nbsp;&nbsp;
                  {isPinned && <Tooltip title={`Pinned at ${formatDate(feed.pinnedAt)}`}><a title="Unpin this post" aria-hidden onClick={() => this.pinToProfile()}><PushpinOutlined /></a></Tooltip>}
                  &nbsp;&nbsp;
                  {performer?.live > 0 && user?._id !== performer?._id && <a aria-hidden onClick={this.handleJoinStream} className="live-status">Live</a>}
                </h4>
                <h5>
                  @
                  {performer?.username || 'n/a'}
                </h5>
              </div>
              {!performer?.isOnline ? <span className="online-status" /> : <span className="online-status active" />}
            </div>
          </Link>
          <div className="feed-top-right">
            <span className="feed-time">{formatDate(feed.updatedAt, 'MMM DD')}</span>
            {dropdown}
          </div>
        </div>
        <div className="feed-container">
          <div className="feed-text">
            {feed.text}
            {polls && polls.length > 0 && (
              <div className="feed-polls">
                {feed.pollDescription && <h4 className="p-question">{feed.pollDescription}</h4>}
                {polls.map((poll) => (
                  <div aria-hidden className="p-item" key={poll._id} onClick={this.votePoll.bind(this, poll)}>
                    <span className="p-desc">{poll?.description}</span>
                    {' '}
                    <span>{poll?.totalVote || 0}</span>
                  </div>
                ))}
                <div className="total-vote">
                  <span>
                    {intl.formatMessage({ id: 'total', defaultMessage: 'Total' })}
                    {' '}
                    {shortenLargeNumber(totalVote)}
                    {' '}
                    {totalVote < 2 ? intl.formatMessage({ id: 'vote', defaultMessage: 'vote' }) : intl.formatMessage({ id: 'votes', defaultMessage: 'votes' })}
                  </span>
                  {feed.pollExpiredAt && moment(feed.pollExpiredAt).isAfter(moment()) ? (
                    <span>
                      {`${moment(feed.pollExpiredAt).diff(moment(), 'days')}d `}
                      <ReactMomentCountDown toDate={moment(feed.pollExpiredAt)} />
                    </span>
                  ) : <span>{intl.formatMessage({ id: 'closed', defaultMessage: 'Closed' })}</span>}
                </div>
              </div>
            )}
          </div>
          {canView && (
            <div className="feed-content">
              <FeedSlider feed={feed} />
            </div>
          )}
          {!canView && (
            <div className="lock-content">
              {/* eslint-disable-next-line no-nested-ternary */}
              <div className="feed-bg" style={{ backgroundImage: `url(${thumbUrl})`, filter: thumbUrl === '/static/leaf.jpg' ? 'blur(2px)' : 'blur(20px)' }} />
              <div className="lock-middle">
                {(isHovered) ? <UnlockOutlined /> : <LockOutlined />}
                {!feed.isSale && !feed.isSubscribed && (
                  <Button
                    onMouseEnter={() => this.setState({ isHovered: true })}
                    onMouseLeave={() => this.setState({ isHovered: false })}
                    disabled={user.isPerformer}
                    className="secondary"
                    onClick={() => updateSubscription({ showModal: true, performer: feed?.performer, subscriptionType: 'monthly' })}
                  >
                    {intl.formatMessage({ id: 'subscribeToUnlock', defaultMessage: 'Subscribe to unlock' })}
                  </Button>
                )}
                {feed.isSale && feed.price > 0 && !isBought && (
                  <Button
                    onMouseEnter={() => this.setState({ isHovered: true })}
                    onMouseLeave={() => this.setState({ isHovered: false })}
                    disabled={user.isPerformer}
                    className="secondary"
                    onClick={() => this.setState({ openPurchaseModal: true })}
                  >
                    {intl.formatMessage({ id: 'pay', defaultMessage: 'Pay' })}
                    {' '}
                    $
                    {(feed.price || 0).toFixed(2)}
                    {' '}
                    {intl.formatMessage({ id: 'toUnlockLowCase', defaultMessage: 'to unlock' })}
                  </Button>
                )}
                {(feed.isSale && !feed.price && !user._id) && (
                <Button
                  onMouseEnter={() => this.setState({ isHovered: true })}
                  onMouseLeave={() => this.setState({ isHovered: false })}
                  disabled={user.isPerformer}
                  className="secondary"
                  onClick={() => Router.push({ pathname: '/model/profile', query: { username: performer?.username || performer?._id } }, `/${performer?.username || performer?._id}`)}
                >
                  {intl.formatMessage({ id: 'followForFree', defaultMessage: 'Follow for free' })}
                </Button>
                )}
                {feed.teaser && (
                  <Button className="teaser-btn" type="link" onClick={() => this.setState({ openTeaser: true })}>
                    {intl.formatMessage({ id: 'viewTeaser', defaultMessage: 'View teaser' })}
                  </Button>
                )}
              </div>
              {feed.files && feed.files.length > 0 && (
                <div className="count-media">
                  <span className="count-media-item">
                    {images.length > 0 && (
                      <span>
                        {images.length}
                        {' '}
                        <FileImageOutlined />
                        {' '}
                      </span>
                    )}
                    {videos.length > 0 && images.length > 0 && '|'}
                    {videos.length > 0 && (
                      <span>
                        {videos.length > 1 && videos.length}
                        {' '}
                        <VideoCameraOutlined />
                        {' '}
                        {videos.length === 1 && videoDuration(videos[0].duration)}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="feed-bottom">
          <div className="feed-actions">
            <div className="action-item">
              <span aria-hidden className={isLiked ? 'action-ico active' : 'action-ico'} onClick={this.handleLike.bind(this)}>
                <HeartOutlined />
                {' '}
                {shortenLargeNumber(totalLike)}
              </span>
              <span aria-hidden className={isOpenComment ? 'action-ico active' : 'action-ico'} onClick={this.onOpenComment.bind(this)}>
                <CommentOutlined />
                {' '}
                {shortenLargeNumber(totalComment)}
              </span>
              {performer && (
                <span aria-hidden className="action-ico" onClick={() => this.setState({ openTipModal: true })}>
                  <DollarOutlined />
                  {' '}
                  {intl.formatMessage({ id: 'sendTip', defaultMessage: 'Send Tip' })}
                </span>
              )}
            </div>
            <div className="action-item">
              <span aria-hidden className={openReportModal ? 'action-ico active' : 'action-ico'} onClick={() => this.setState({ openReportModal: true })}>
                <Tooltip title={intl.formatMessage({ id: 'report', defaultMessage: 'Report' })}><FlagOutlined /></Tooltip>
              </span>
              <span aria-hidden className={isBookMarked ? 'action-ico active' : 'action-ico'} onClick={this.handleBookmark.bind(this)}>
                <Tooltip title={!isBookMarked ? intl.formatMessage({
                  id: 'addToBookmarks',
                  defaultMessage: 'Add to Bookmarks'
                }) : intl.formatMessage({
                  id: 'removeFromBookmarks',
                  defaultMessage: 'Remove from Bookmarks'
                })}
                >
                  <BookOutlined />
                </Tooltip>
              </span>
            </div>
          </div>
          {isOpenComment && (
            <div className="feed-comment">
              <CommentForm
                creator={user}
                onSubmit={handleCreateComment.bind(this)}
                objectId={feed._id}
                objectType="feed"
                requesting={commenting}
              />
              <ListComments
                key={`list_comments_${feed._id}_${comments.length}`}
                requesting={fetchingComment}
                comments={comments}
                total={totalComments}
                onDelete={this.deleteComment.bind(this)}
                user={user}
                canReply
              />
              {comments.length < totalComments && (
                <p className="text-center">
                  <a aria-hidden onClick={this.moreComment.bind(this)}>
                    {intl.formatMessage({ id: 'moreComments', defaultMessage: 'More comments' })}
                    ...
                  </a>
                </p>
              )}
            </div>
          )}
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
          <TipPerformerForm performer={performer} submiting={requesting} onFinish={this.sendTip.bind(this)} />
        </Modal>
        <Modal
          key="purchase_post"
          className="purchase-modal"
          title={null}
          visible={openPurchaseModal}
          footer={null}
          width={600}
          destroyOnClose
          onCancel={() => this.setState({ openPurchaseModal: false })}
        >
          <PurchaseFeedForm feed={feed} submiting={requesting} onFinish={this.purchaseFeed.bind(this)} />
        </Modal>
        <Modal
          key="report_post"
          className="subscription-modal"
          title={null}
          visible={openReportModal}
          footer={null}
          destroyOnClose
          onCancel={() => this.setState({ openReportModal: false })}
        >
          <ReportForm performer={performer} submiting={requesting} onFinish={this.handleReport.bind(this)} />
        </Modal>
        <Modal
          key="teaser_video"
          title="Teaser video"
          visible={openTeaser}
          footer={null}
          onCancel={() => this.setState({ openTeaser: false })}
          width={650}
          destroyOnClose
          className="modal-teaser-preview"
        >
          <VideoPlayer
            key={feed?.teaser?._id}
            {...{
              autoplay: true,
              controls: true,
              playsinline: true,
              fluid: true,
              sources: [
                {
                  src: feed?.teaser?.url,
                  type: 'video/mp4'
                }
              ]
            }}
          />
        </Modal>
      </div>
    );
  }
}

const mapStates = (state: any) => {
  const { commentMapping, comment } = state.comment;
  return {
    user: state.user.current,
    commentMapping,
    comment
  };
};

const mapDispatch = {
  getComments, moreComment, createComment, deleteComment, updateBalance, setSubscription
};
export default injectIntl(connect(mapStates, mapDispatch)(FeedCard));
