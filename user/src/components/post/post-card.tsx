/* eslint-disable no-prototype-builtins */
import { Component, createRef, forwardRef } from 'react';
import {
  Menu, Dropdown, Divider, message, Modal, Tooltip, Button
} from 'antd';
import {
  HeartOutlined, CommentOutlined, BookOutlined, UnlockOutlined, EyeOutlined,
  MoreOutlined, DollarOutlined, LockOutlined, FlagOutlined,
  FileImageOutlined, VideoCameraOutlined
} from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import Link from 'next/link';
import { CommentForm, ListComments } from '@components/comment';
import {
  getComments, moreComment, createComment, deleteComment
} from '@redux/comment/actions';
import { formatDate, videoDuration, shortenLargeNumber } from '@lib/index';
import {
  reactionService, feedService, tokenTransctionService, paymentService, reportService
} from '@services/index';
import { connect } from 'react-redux';
import { TipPerformerForm } from '@components/performer/tip-form';
import ReactMomentCountDown from 'react-moment-countdown';
import moment from 'moment';
import { VideoPlayer } from '@components/common/video-player';
import { ConfirmSubscriptionPerformerForm } from '@components/performer';
import { ReportForm } from '@components/report/report-form';
import Router from 'next/router';
import { updateBalance } from '@redux/user/actions';
import Loader from '@components/common/base/loader';
import { IFeed, IUser } from 'src/interfaces';
import dynamic from 'next/dynamic';
import { PurchaseFeedForm } from './confirm-purchase';
import FeedSlider from './post-slider';
import './index.less';

const Subscriber = dynamic(() => import('@components/streaming/agora/subscriber'), { ssr: false });
const ForwardedSubscriber = forwardRef((props: any, ref) => <Subscriber {...props} forwardedRef={ref} />);

interface IProps {
  feed: IFeed;
  onDelete?: Function;
  user: IUser;
  updateBalance: Function;
  getComments: Function;
  moreComment: Function;
  createComment: Function;
  deleteComment: Function;
  commentMapping: any;
  comment: any;
  siteName: string;
}

class FeedCard extends Component<IProps> {
  private subscriberRef = createRef<{ join: any, leave: any }>();

  subscriptionType = 'monthly';

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
    submiting: false,
    polls: [],
    requesting: false,
    openSubscriptionModal: false,
    openReportModal: false
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
        polls: feed.polls ? feed.polls : []
      });
      this.subscriptionType = feed?.performer?.isFreeSubscription ? 'free' : 'monthly';
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

  // eslint-disable-next-line react/sort-comp
  async handleLike() {
    const { feed } = this.props;
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
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  }

  async handleBookmark() {
    const { feed, user } = this.props;
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
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  }

  async handleReport(reason: string) {
    const { feed } = this.props;
    if (!reason || reason.length < 20) {
      message.error('You report must be at least 20 characters');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await reportService.create({
        target: 'feed', targetId: feed._id, performerId: feed.fromSourceId, description: reason
      });
      message.success('Your report has been sent');
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ requesting: false, openReportModal: false });
    }
  }

  async onOpenComment() {
    const { feed, getComments: handleGetComment } = this.props;
    const {
      isOpenComment, isFirstLoadComment, itemPerPage, commentPage
    } = this.state;
    this.setState({ isOpenComment: !isOpenComment });
    if (isFirstLoadComment) {
      await this.setState({ isFirstLoadComment: false });
      handleGetComment({
        objectId: feed._id,
        limit: itemPerPage,
        offset: commentPage
      });
    }
  }

  copyLink() {
    const { feed } = this.props;
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
    message.success('Copied to clipboard');
  }

  async moreComment() {
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

  async deleteComment(item) {
    const { deleteComment: handleDelete } = this.props;
    if (!window.confirm('Are you sure to remove this comment?')) return;
    handleDelete(item._id);
  }

  async subscribe() {
    const { feed, user } = this.props;
    if (!user._id) {
      message.error('Please log in');
      Router.push('/auth/login');
      return;
    }
    if (user.isPerformer) return;
    if (!user.stripeCardIds || !user.stripeCardIds.length) {
      message.error('Please add payment card');
      Router.push('/user/cards');
      return;
    }
    try {
      await this.setState({ submiting: true });
      await paymentService.subscribePerformer({
        type: this.subscriptionType,
        performerId: feed.fromSourceId,
        paymentGateway: 'stripe',
        stripeCardId: user.stripeCardIds[0]
      });
      this.setState({ openSubscriptionModal: false });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
      this.setState({ openSubscriptionModal: false, submiting: false });
    }
  }

  async sendTip(price) {
    const { feed, user, updateBalance: handleUpdateBalance } = this.props;
    if (user._id === feed?.performer?._id) {
      message.error('Models cannot tip for themselves');
      return;
    }
    if (user.balance < price) {
      message.error('Your token balance is not enough');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await tokenTransctionService.sendTip(feed?.performer?._id, { performerId: feed?.performer?._id, price });
      message.success('Thank you for the tip');
      handleUpdateBalance({ token: -price });
    } catch (e) {
      const err = await e;
      message.error(err.message || 'error occured, please try again later');
    } finally {
      this.setState({ requesting: false, openTipModal: false });
    }
  }

  async purchaseFeed() {
    const { feed, user, updateBalance: handleUpdateBalance } = this.props;
    if (user.balance < feed.price) {
      message.error('Your token balance is not enough');
      Router.push('/token-package');
      return;
    }
    try {
      await this.setState({ requesting: true });
      await tokenTransctionService.purchaseFeed(feed._id, {});
      message.success('Unlocked successfully!');
      this.setState({ isBought: true });
      handleUpdateBalance({ token: -feed.price });
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
    } finally {
      this.setState({ requesting: false, openPurchaseModal: false });
    }
  }

  async votePoll(poll: any) {
    const { feed } = this.props;
    const { polls } = this.state;
    const isExpired = new Date(feed.pollExpiredAt) < new Date();
    if (isExpired) {
      message.error('The poll is now closed');
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
      message.error(error.message || 'Something went wrong, please try again later');
      this.setState({ requesting: false });
    }
  }

  render() {
    const {
      feed, user, commentMapping, comment, onDelete: handleDelete, createComment: handleCreateComment, siteName
    } = this.props;
    const { performer } = feed;
    const { requesting: commenting } = comment;
    const fetchingComment = commentMapping.hasOwnProperty(feed._id) ? commentMapping[feed._id].requesting : false;
    const comments = commentMapping.hasOwnProperty(feed._id) ? commentMapping[feed._id].items : [];
    const totalComments = commentMapping.hasOwnProperty(feed._id) ? commentMapping[feed._id].total : 0;
    const {
      isOpenComment, isLiked, totalComment, totalLike, isHovered, isBought,
      openTipModal, openPurchaseModal, submiting, polls, isBookMarked,
      openTeaser, openSubscriptionModal, openReportModal, requesting
    } = this.state;
    const canView = (!feed.isSale && feed.isSubscribed) || (feed.isSale && isBought) || feed.type === 'text';
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
              Details
            </a>
          </Link>
        </Menu.Item>
        {user._id === feed.fromSourceId && (
          <Menu.Item key={`edit_post_${feed._id}`}>
            <Link href={{ pathname: '/model/my-post/edit', query: { id: feed._id } }}>
              <a>
                Edit post
              </a>
            </Link>
          </Menu.Item>
        )}
        <Menu.Item key={`copy_link_${feed._id}`} onClick={() => this.copyLink()}>
          <a>
            Copy link to clipboard
          </a>
        </Menu.Item>
        {/* {user._id === feed.fromSourceId && (
        <Menu.Item key={`pin_profile_${feed._id}`}>
          <a target="_blank" rel="noopener noreferrer" href="#">
            Pin to profile page
          </a>
        </Menu.Item>
        )} */}
        {/* <Menu.Item key={`statistic_${feed._id}`}>
          <a target="_blank" href="#">
            Post statistics
          </a>
        </Menu.Item> */}
        {user._id === feed.fromSourceId && <Divider style={{ margin: '10px 0' }} />}
        {user._id === feed.fromSourceId && <Menu.Item key={`delete_post_${feed._id}`}><a aria-hidden onClick={handleDelete.bind(this, feed)}>Delete post</a></Menu.Item>}
      </Menu>
    );
    const dropdown = (
      <Dropdown overlay={menu}>
        <a aria-hidden className="dropdown-options" onClick={(e) => e.preventDefault()}>
          <MoreOutlined />
        </a>
      </Dropdown>
    );

    if (feed.type === 'stream') {
      return (
        <div className="feed-card">
          <div className="feed-top">
            <Link href={{ pathname: '/model/profile', query: { username: performer?.username || performer?._id } }} as={`/${performer?.username || performer?._id}`}>
              <div className="feed-top-left">
                <img alt="per_atv" src={performer?.avatar || '/static/no-avatar.png'} width="50px" />
                <div className="feed-name">
                  <h4>
                    {performer?.name || 'N/A'}
                    {' '}
                    {performer?.verifiedAccount && <TickIcon />}
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
              Live
            </div>
            {!feed.isSubscribed ? (
              <div className="lock-content">
                <div className="feed-bg" style={{ backgroundImage: `url(${thumbUrl})`, filter: thumbUrl === '/static/leaf.jpg' ? 'blur(2px)' : 'blur(20px)' }} />
                <Button
                  onMouseEnter={() => this.setState({ isHovered: true })}
                  onMouseLeave={() => this.setState({ isHovered: false })}
                  disabled={user.isPerformer}
                  className="secondary"
                  onClick={() => this.setState({ openSubscriptionModal: true })}
                >
                  Subscribe to unlock
                </Button>
              </div>
            ) : (
              <div className="feed-content">
                {!feed.isSale ? (
                  <>
                    <ForwardedSubscriber
                      ref={this.subscriberRef}
                      {...{
                        localUId: user._id,
                        remoteUId: performer._id,
                        conversationId: (feed as any).targetId
                      }}
                    />
                    <Button block className="primary" onClick={() => this.subscriberRef.current.join()}>join</Button>
                    <Button block className="secondary" onClick={() => this.subscriberRef.current.leave()}>Leave</Button>
                  </>
                ) : (
                  <Button onClick={() => Router.push(
                    {
                      pathname: '/streaming/details',
                      query: {
                        username: performer?.username || performer?._id
                      }
                    },
                    `/streaming/${performer?.username || performer?._id
                    }`
                  )}
                  >
                    View full content
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="feed-card">
        <div className="feed-top">
          <Link href={{ pathname: '/model/profile', query: { username: performer?.username || performer?._id } }} as={`/${performer?.username || performer?._id}`}>
            <div className="feed-top-left">
              <img alt="per_atv" src={performer?.avatar || '/static/no-avatar.png'} width="50px" />
              <div className="feed-name">
                <h4>
                  {performer?.name || 'N/A'}
                  {' '}
                  {performer?.verifiedAccount && <TickIcon />}
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
                    Total
                    {' '}
                    {shortenLargeNumber(totalVote)}
                    {' '}
                    {totalVote < 2 ? 'vote' : 'votes'}
                  </span>
                  {feed.pollExpiredAt && moment(feed.pollExpiredAt).isAfter(moment()) ? (
                    <span>
                      {`${moment(feed.pollExpiredAt).diff(moment(), 'days')}d `}
                      <ReactMomentCountDown toDate={moment(feed.pollExpiredAt)} />
                    </span>
                  ) : <span>Closed</span>}
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
                {(isHovered || canView) ? <UnlockOutlined /> : <LockOutlined />}
                {!feed.isSale && !feed.isSubscribed && (
                  <Button
                    onMouseEnter={() => this.setState({ isHovered: true })}
                    onMouseLeave={() => this.setState({ isHovered: false })}
                    disabled={user.isPerformer}
                    className="secondary"
                    onClick={() => this.setState({ openSubscriptionModal: true })}
                  >
                    Subscribe to unlock
                  </Button>
                )}
                {feed.isSale && !isBought && (
                  <Button
                    onMouseEnter={() => this.setState({ isHovered: true })}
                    onMouseLeave={() => this.setState({ isHovered: false })}
                    disabled={user.isPerformer}
                    className="secondary"
                    onClick={() => this.setState({ openPurchaseModal: true })}
                  >
                    Pay&nbsp;
                    <img alt="coin" src="/static/coin-ico.png" width="15px" />
                    {feed.price.toFixed(2)}
                    {' '}
                    to unlock
                  </Button>
                )}
                {feed.teaser && (
                  <Button type="link" onClick={() => this.setState({ openTeaser: true })}>
                    <EyeOutlined />
                    View teaser
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
                  Send tip
                </span>
              )}
            </div>
            <div className="action-item">
              <span aria-hidden className={openReportModal ? 'action-ico active' : 'action-ico'} onClick={() => this.setState({ openReportModal: true })}>
                <Tooltip title="Report"><FlagOutlined /></Tooltip>
              </span>
              <span aria-hidden className={isBookMarked ? 'action-ico active' : 'action-ico'} onClick={this.handleBookmark.bind(this)}>
                <Tooltip title={!isBookMarked ? 'Add to Bookmarks' : 'Remove from Bookmarks'}><BookOutlined /></Tooltip>
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
                siteName={siteName}
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
              {comments.length < totalComments && <p className="text-center"><a aria-hidden onClick={this.moreComment.bind(this)}>More comments...</a></p>}
            </div>
          )}
        </div>
        <Modal
          key="tip_performer"
          className="subscription-modal"
          title={null}
          width={350}
          visible={openTipModal}
          onOk={() => this.setState({ openTipModal: false })}
          footer={null}
          onCancel={() => this.setState({ openTipModal: false })}
        >
          <TipPerformerForm performer={performer} submiting={requesting} onFinish={this.sendTip.bind(this)} />
        </Modal>
        <Modal
          key="purchase_post"
          className="subscription-modal"
          title={null}
          visible={openPurchaseModal}
          footer={null}
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
          key="subscribe_performer"
          className="subscription-modal"
          width={500}
          title={null}
          visible={openSubscriptionModal}
          footer={null}
          destroyOnClose
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
        {submiting && <Loader customText="We are processing your payment, please do not reload this page until it's done." />}
      </div>
    );
  }
}

const mapStates = (state: any) => {
  const { commentMapping, comment } = state.comment;
  return {
    siteName: state.ui.siteName,
    user: state.user.current,
    commentMapping,
    comment
  };
};

const mapDispatch = {
  getComments, moreComment, createComment, deleteComment, updateBalance
};
export default connect(mapStates, mapDispatch)(FeedCard);
